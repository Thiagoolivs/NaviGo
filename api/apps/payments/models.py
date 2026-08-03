from django.db import models

from apps.common.models import TimestampedModel
from apps.participants.models import Participant
from apps.trips.models import Trip


class Payment(TimestampedModel):
    class Status(models.TextChoices):
        PENDING = "pending", "Pendente"
        PARTIALLY_PAID = "partially_paid", "Parcialmente pago"
        PAID = "paid", "Pago"
        OVERDUE = "overdue", "Em atraso"
        REFUNDED = "refunded", "Estornado"

    participant = models.ForeignKey(
        Participant, on_delete=models.CASCADE, related_name="payments"
    )
    trip = models.ForeignKey(Trip, on_delete=models.CASCADE, related_name="payments")
    total_amount = models.DecimalField("valor total", max_digits=12, decimal_places=2)
    method = models.CharField("método", max_length=20, default="pix")
    status = models.CharField(
        "status", max_length=20, choices=Status.choices, default=Status.PENDING
    )

    def __str__(self) -> str:
        return f"Pagamento de {self.participant} ({self.get_status_display()})"


class Installment(TimestampedModel):
    class Status(models.TextChoices):
        PENDING = "pending", "Pendente"
        PAID = "paid", "Pago"
        OVERDUE = "overdue", "Em atraso"
        FAILED = "failed", "Falhou"

    payment = models.ForeignKey(Payment, on_delete=models.CASCADE, related_name="installments")
    amount = models.DecimalField("valor", max_digits=12, decimal_places=2)
    due_date = models.DateField("vencimento")
    status = models.CharField(
        "status", max_length=20, choices=Status.choices, default=Status.PENDING
    )
    # Identificador do PSP — único garante idempotência da baixa via webhook.
    pix_txid = models.CharField("txid PIX", max_length=140, unique=True, null=True, blank=True)
    pix_qr_code = models.TextField("QR Code PIX (copia e cola)", blank=True)
    paid_at = models.DateTimeField("pago em", null=True, blank=True)

    class Meta:
        ordering = ["due_date"]

    def __str__(self) -> str:
        return f"Parcela {self.amount} — vence {self.due_date}"
