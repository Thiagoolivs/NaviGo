from rest_framework import serializers

from .models import Installment, Payment


class InstallmentSerializer(serializers.ModelSerializer):
    participant_name = serializers.CharField(source="payment.participant.name", read_only=True)

    class Meta:
        model = Installment
        fields = [
            "id", "payment", "participant_name", "amount", "due_date", "status",
            "pix_txid", "pix_qr_code", "paid_at",
        ]
        read_only_fields = ["payment", "pix_txid", "pix_qr_code", "paid_at"]


class PaymentSerializer(serializers.ModelSerializer):
    installments = InstallmentSerializer(many=True, read_only=True)
    participant_name = serializers.CharField(source="participant.name", read_only=True)

    class Meta:
        model = Payment
        fields = [
            "id", "participant", "participant_name", "trip", "total_amount",
            "method", "status", "installments",
        ]
        read_only_fields = ["participant", "trip"]


class ReplanSerializer(serializers.Serializer):
    """Re-parcelamento: divide o saldo em N parcelas."""

    installments = serializers.IntegerField(min_value=1, max_value=12)
