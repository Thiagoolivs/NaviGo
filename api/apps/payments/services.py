"""Regras de pagamento do organizador."""

from __future__ import annotations

import datetime as dt
from decimal import Decimal

from django.db import transaction
from django.utils import timezone

from apps.participants.services.enrollment import (
    DAYS_BETWEEN_INSTALLMENTS,
    split_amount,
)

from .models import Installment, Payment

ZERO = Decimal("0.00")


def refresh_payment_status(payment: Payment) -> Payment:
    """Recalcula o status do pagamento a partir das parcelas."""
    parcelas = list(payment.installments.all())
    pago = sum((p.amount for p in parcelas if p.status == Installment.Status.PAID), ZERO)

    if not parcelas or payment.total_amount == ZERO:
        novo = Payment.Status.PENDING
    elif pago >= payment.total_amount:
        novo = Payment.Status.PAID
    elif pago > ZERO:
        novo = Payment.Status.PARTIALLY_PAID
    elif any(
        p.due_date < dt.date.today() and p.status != Installment.Status.PAID for p in parcelas
    ):
        novo = Payment.Status.OVERDUE
    else:
        novo = Payment.Status.PENDING

    if payment.status != novo:
        payment.status = novo
        payment.save(update_fields=["status", "updated_at"])
    return payment


def mark_installment(installment: Installment, *, paid: bool) -> Installment:
    """Baixa (ou estorna) manualmente uma parcela — muita gente paga por fora."""
    installment.status = Installment.Status.PAID if paid else Installment.Status.PENDING
    installment.paid_at = timezone.now() if paid else None
    installment.save(update_fields=["status", "paid_at", "updated_at"])
    refresh_payment_status(installment.payment)
    return installment


@transaction.atomic
def replan(payment: Payment, installments: int) -> Payment:
    """Divide o SALDO em aberto em N novas parcelas.

    As parcelas já pagas são preservadas; apenas as em aberto são substituídas.
    """
    parcelas = list(payment.installments.all())
    pagas = [p for p in parcelas if p.status == Installment.Status.PAID]
    pago = sum((p.amount for p in pagas), ZERO)
    saldo = max(payment.total_amount - pago, ZERO)

    payment.installments.exclude(id__in=[p.id for p in pagas]).delete()

    if saldo > ZERO:
        hoje = dt.date.today()
        Installment.objects.bulk_create(
            [
                Installment(
                    payment=payment,
                    amount=valor,
                    due_date=hoje + dt.timedelta(days=i * DAYS_BETWEEN_INSTALLMENTS),
                )
                for i, valor in enumerate(split_amount(saldo, installments))
            ]
        )
    refresh_payment_status(payment)
    return payment
