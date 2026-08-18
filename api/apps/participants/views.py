from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.trips.models import Trip, TripStatus

from .models import Participant, ParticipantRequirement, TripRequirement
from .serializers import (
    ParticipantRequirementSerializer,
    ParticipantSerializer,
    PublicEnrollmentSerializer,
    TripRequirementSerializer,
)
from .services.enrollment import TripFullError, TripNotOpenError, enroll, spots_left
from .services.requirements import ensure_default_requirements, sync_participant_requirements
from .services.roster import build_roster, build_summary


class PublicEnrollmentView(APIView):
    """Inscrição pública: o participante entra pelo link/QR, sem conta."""

    permission_classes = [permissions.AllowAny]

    def post(self, request: Request, slug: str) -> Response:
        trip = get_object_or_404(Trip, slug=slug, status=TripStatus.PUBLISHED)

        serializer = PublicEnrollmentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        dados = dict(serializer.validated_data)
        parcelas = dados.pop("installments", 1)

        try:
            participant = enroll(trip, data=dados, installments=parcelas)
        except TripFullError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_409_CONFLICT)
        except TripNotOpenError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        pagamento = participant.payments.first()
        return Response(
            {
                "id": participant.id,
                "name": participant.name,
                "trip": trip.name,
                "total_amount": pagamento.total_amount if pagamento else 0,
                "installments": [
                    {"amount": i.amount, "due_date": i.due_date}
                    for i in (pagamento.installments.all() if pagamento else [])
                ],
                "requirements": [
                    s.requirement.name for s in participant.requirement_status.all()
                ],
                "spots_left": spots_left(trip),
            },
            status=status.HTTP_201_CREATED,
        )


class TripRosterView(APIView):
    """Painel de gestão da viagem (a "planilha" do organizador)."""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request: Request, trip_id: int) -> Response:
        trip = get_object_or_404(Trip, pk=trip_id, organizer=request.user)
        roster = build_roster(trip)
        return Response({"summary": build_summary(roster, trip), "participants": roster})


class ParticipantViewSet(viewsets.ModelViewSet):
    """Participantes das viagens do organizador autenticado."""

    serializer_class = ParticipantSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = Participant.objects.filter(trip__organizer=self.request.user).select_related("trip")
        trip_id = self.request.query_params.get("trip")
        return qs.filter(trip_id=trip_id) if trip_id else qs

    def perform_update(self, serializer) -> None:
        participant = serializer.save()
        # Ser (ou deixar de ser) menor muda os requisitos aplicáveis.
        sync_participant_requirements(participant)

    @action(detail=True, methods=["get"])
    def requirements(self, request: Request, pk: str | None = None) -> Response:
        participant = self.get_object()
        sync_participant_requirements(participant)
        status_qs = participant.requirement_status.select_related("requirement")
        return Response(ParticipantRequirementSerializer(status_qs, many=True).data)


class ParticipantRequirementViewSet(viewsets.ModelViewSet):
    """Marca a entrega de um requisito (autorização, documento...)."""

    serializer_class = ParticipantRequirementSerializer
    permission_classes = [permissions.IsAuthenticated]
    http_method_names = ["get", "patch", "head", "options"]

    def get_queryset(self):
        return ParticipantRequirement.objects.filter(
            participant__trip__organizer=self.request.user
        ).select_related("requirement", "participant")

    def perform_update(self, serializer) -> None:
        delivered = serializer.validated_data.get("delivered")
        extra = {}
        if delivered is not None:
            extra["delivered_at"] = timezone.now() if delivered else None
        serializer.save(**extra)


class TripRequirementViewSet(viewsets.ModelViewSet):
    """Configura o que a viagem exige (o organizador pode editar livremente)."""

    serializer_class = TripRequirementSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = TripRequirement.objects.filter(trip__organizer=self.request.user)
        trip_id = self.request.query_params.get("trip")
        return qs.filter(trip_id=trip_id) if trip_id else qs

    def perform_create(self, serializer) -> None:
        if serializer.validated_data["trip"].organizer != self.request.user:
            raise PermissionDenied("Esta viagem não pertence a você.")
        serializer.save()

    @action(detail=False, methods=["post"])
    def defaults(self, request: Request) -> Response:
        """Cria os requisitos sugeridos para o tipo da viagem."""
        trip = get_object_or_404(Trip, pk=request.data.get("trip"), organizer=request.user)
        criados = ensure_default_requirements(trip)
        return Response(TripRequirementSerializer(criados, many=True).data)
