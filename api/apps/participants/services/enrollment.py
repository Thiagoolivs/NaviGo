"""Inscrição do participante e montagem do plano de pagamento."""

from __future__ import annotations

import datetime as dt
from decimal import ROUND_HALF_UP, Decimal

from django.db import transaction
from django.utils import timezone

from apps.payments.models import Installment, Payment
from apps.trips.models import Trip
from apps.trips.services.assistant import price_for_trip

from ..models import Participant
from .requirements import ensure_default_requirements, sync_participant_requirements

MAX_INSTALLMENTS = 12
# Intervalo entre parcelas (mensal aproximado, sem dependência extra).
DAYS_BETWEEN_INSTALLMENTS = 30


class TripFullError(RuntimeError):
    """A viagem atingiu o limite de vagas."""


class TripNotOpenError(RuntimeError):
    """A viagem não está aberta para inscrições."""


def split_amount(total: Decimal, parts: int) -> list[Decimal]:
    """Divide um valor em N parcelas cujo somatório é exatamente o total.

    A sobra dos centavos vai para a primeira parcela.
    """
    if parts < 1:
        raise ValueError("O número de parcelas deve ser pelo menos 1.")
    total = Decimal(total).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    base = (total / parts).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    parcelas = [base] * parts
    parcelas[0] += total - sum(parcelas)
    return parcelas


def spots_left(trip: Trip) -> int | None:
    if trip.capacity is None:
        return None
    ativos = trip.participants.exclude(status=Participant.Status.CANCELLED).count()
    return max(trip.capacity - ativos, 0)


@transaction.atomic
def enroll(
    trip: Trip,
    *,
    data: dict,
    installments: int = 1,
    amount: Decimal | None = None,
) -> Participant:
    """Inscreve o participante e gera as parcelas do pagamento.

    `amount` permite ao organizador definir um valor específico; por padrão usa
    o valor por participante calculado a partir do orçamento da viagem.
    """
    if trip.status != "published":
        raise TripNotOpenError("Esta viagem não está aberta para inscrições.")

    restantes = spots_left(trip)
    if restantes is not None and restantes <= 0:
        raise TripFullError("As vagas para esta viagem esgotaram.")

    installments = max(1, min(int(installments), MAX_INSTALLMENTS))

    participant = Participant.objects.create(
        trip=trip,
        consent_at=timezone.now() if data.get("consent_accepted") else None,
        **data,
    )

    # Requisitos (autorização, documentos...) aplicáveis a este participante.
    ensure_default_requirements(trip)
    sync_participant_requirements(participant)

    total = amount if amount is not None else Decimal(price_for_trip(trip)["price_per_participant"])
    total = Decimal(total).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

    payment = Payment.objects.create(
        participant=participant, trip=trip, total_amount=total, method="pix"
    )
    if total > 0:
        hoje = dt.date.today()
        Installment.objects.bulk_create(
            [
                Installment(
                    payment=payment,
                    amount=valor,
                    due_date=hoje + dt.timedelta(days=i * DAYS_BETWEEN_INSTALLMENTS),
                )
                for i, valor in enumerate(split_amount(total, installments))
            ]
        )
    return participant
