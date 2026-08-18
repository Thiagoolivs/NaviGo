from django.db.models import QuerySet
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.generics import RetrieveAPIView
from rest_framework.request import Request
from rest_framework.response import Response

from .models import BudgetItem, Task, Trip, TripStatus
from .serializers import (
    AssistantSuggestionSerializer,
    BudgetItemSerializer,
    PublicTripSerializer,
    TaskSerializer,
    TripSerializer,
)
from .services import assistant as assistant_service


class TripViewSet(viewsets.ModelViewSet):
    """Viagens do organizador autenticado."""

    serializer_class = TripSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self) -> QuerySet[Trip]:
        return (
            Trip.objects.filter(organizer=self.request.user)
            .select_related("config")
            .prefetch_related("budget_items", "tasks", "participants")
        )

    @action(detail=True, methods=["post"])
    def assistant(self, request: Request, pk: str | None = None) -> Response:
        """Consulta a IA e cria o checklist automático da viagem."""
        trip = self.get_object()
        try:
            suggestion = assistant_service.generate_structure(trip)
        except Exception as exc:  # falha de provedor/credencial não deve derrubar a API
            return Response(
                {"detail": f"Assistente indisponível: {exc}"},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        created = assistant_service.apply_suggestion(trip, suggestion)
        payload = {
            "checklist": suggestion.checklist,
            "budget_categories": assistant_service.valid_categories(suggestion),
            "notes": suggestion.notes,
            "tasks_created": len(created),
        }
        return Response(AssistantSuggestionSerializer(payload).data)

    @action(detail=True, methods=["get"])
    def pricing(self, request: Request, pk: str | None = None) -> Response:
        """Rateio da viagem (valor por participante)."""
        trip = self.get_object()
        participants = request.query_params.get("participants")
        try:
            base = int(participants) if participants else None
        except ValueError:
            return Response(
                {"detail": "participants deve ser um número inteiro."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if base is not None and base <= 0:
            return Response(
                {"detail": "participants deve ser maior que zero."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return Response(assistant_service.price_for_trip(trip, base))

    @action(detail=True, methods=["post"])
    def publish(self, request: Request, pk: str | None = None) -> Response:
        """Publica a viagem — a partir daí a página pública fica acessível."""
        trip = self.get_object()
        trip.status = TripStatus.PUBLISHED
        trip.save(update_fields=["status", "updated_at"])
        return Response(self.get_serializer(trip).data)


class _TripScopedViewSet(viewsets.ModelViewSet):
    """Base para recursos que pertencem a uma viagem do organizador."""

    permission_classes = [permissions.IsAuthenticated]
    trip_field = "trip"

    def get_queryset(self):
        qs = self.queryset.filter(**{f"{self.trip_field}__organizer": self.request.user})
        trip_id = self.request.query_params.get("trip")
        return qs.filter(**{self.trip_field: trip_id}) if trip_id else qs

    def perform_create(self, serializer) -> None:
        trip = serializer.validated_data["trip"]
        if trip.organizer != self.request.user:
            raise PermissionDenied("Esta viagem não pertence a você.")
        serializer.save()


class BudgetItemViewSet(_TripScopedViewSet):
    queryset = BudgetItem.objects.select_related("trip")
    serializer_class = BudgetItemSerializer


class TaskViewSet(_TripScopedViewSet):
    queryset = Task.objects.select_related("trip")
    serializer_class = TaskSerializer


class PublicTripView(RetrieveAPIView):
    """Página pública da viagem, acessada por link/QR (sem autenticação)."""

    serializer_class = PublicTripSerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = "slug"
    queryset = Trip.objects.filter(status=TripStatus.PUBLISHED).prefetch_related(
        "participants"
    )


__all__ = [
    "BudgetItemViewSet",
    "PublicTripView",
    "TaskViewSet",
    "TripViewSet",
]
