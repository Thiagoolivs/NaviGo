from decimal import Decimal

from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.request import Request
from rest_framework.response import Response

from .models import Installment, Payment
from .providers import Payer, get_payment_provider
from .serializers import InstallmentSerializer, PaymentSerializer, ReplanSerializer
from .services import mark_installment, replan


class PaymentViewSet(viewsets.ReadOnlyModelViewSet):
    """Pagamentos das viagens do organizador."""

    serializer_class = PaymentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = Payment.objects.filter(trip__organizer=self.request.user).select_related(
            "participant"
        ).prefetch_related("installments")
        trip_id = self.request.query_params.get("trip")
        return qs.filter(trip_id=trip_id) if trip_id else qs

    @action(detail=True, methods=["post"])
    def replan(self, request: Request, pk: str | None = None) -> Response:
        """Re-parcela o saldo em aberto (mais ou menos parcelas)."""
        payment = self.get_object()
        serializer = ReplanSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        atualizado = replan(payment, serializer.validated_data["installments"])
        # O prefetch guarda as parcelas antigas em cache; limpa para serializar
        # a lista realmente gravada.
        if getattr(atualizado, "_prefetched_objects_cache", None):
            atualizado._prefetched_objects_cache = {}
        return Response(self.get_serializer(atualizado).data)


class InstallmentViewSet(viewsets.ReadOnlyModelViewSet):
    """Parcelas — baixa manual e geração do QR Code PIX."""

    serializer_class = InstallmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = Installment.objects.filter(
            payment__trip__organizer=self.request.user
        ).select_related("payment__participant")
        trip_id = self.request.query_params.get("trip")
        return qs.filter(payment__trip_id=trip_id) if trip_id else qs

    @action(detail=True, methods=["post"])
    def pay(self, request: Request, pk: str | None = None) -> Response:
        """Marca a parcela como paga (ex.: recebeu em dinheiro ou PIX direto)."""
        return Response(
            self.get_serializer(mark_installment(self.get_object(), paid=True)).data
        )

    @action(detail=True, methods=["post"])
    def unpay(self, request: Request, pk: str | None = None) -> Response:
        """Desfaz a baixa de uma parcela."""
        return Response(
            self.get_serializer(mark_installment(self.get_object(), paid=False)).data
        )

    @action(detail=True, methods=["post"])
    def pix(self, request: Request, pk: str | None = None) -> Response:
        """Gera a cobrança PIX da parcela no PSP configurado."""
        parcela = self.get_object()
        if parcela.pix_qr_code:
            return Response(self.get_serializer(parcela).data)

        participante = parcela.payment.participant
        try:
            provider = get_payment_provider()
            cobranca = provider.create_pix_charge(
                amount=Decimal(parcela.amount),
                description=f"{parcela.payment.trip.name} — {participante.name}",
                reference=f"installment-{parcela.id}",
                payer=Payer(
                    name=participante.name,
                    cpf_cnpj=participante.document,
                    email=participante.email,
                ),
                due_date=parcela.due_date,
            )
        except Exception as exc:  # credencial ausente, PSP fora do ar, CPF faltando...
            return Response(
                {"detail": f"Não foi possível gerar a cobrança PIX: {exc}"},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        parcela.pix_txid = cobranca.txid
        parcela.pix_qr_code = cobranca.qr_code
        parcela.save(update_fields=["pix_txid", "pix_qr_code", "updated_at"])
        return Response(self.get_serializer(parcela).data)
