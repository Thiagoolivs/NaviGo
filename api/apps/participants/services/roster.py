"""Painel de gestão da viagem — a "planilha", porém consultável e agregada.

Reúne, por participante: dados de contato, situação de pagamento (pago, a pagar,
parcelas, atraso) e a entrega dos requisitos (autorização, documentos...).
"""

from __future__ import annotations

import datetime as dt
from decimal import Decimal

from apps.payments.models import Installment
from apps.trips.models import Trip

from ..models import Participant

ZERO = Decimal("0.00")


def _payment_view(participant: Participant, hoje: dt.date) -> dict:
    """Situação financeira consolidada de um participante."""
    pagamentos = list(participant.payments.all())
    parcelas: list[Installment] = [p for pg in pagamentos for p in pg.installments.all()]

    total = sum((pg.total_amount for pg in pagamentos), ZERO)
    pago = sum((p.amount for p in parcelas if p.status == Installment.Status.PAID), ZERO)
    restante = max(total - pago, ZERO)

    em_aberto = [p for p in parcelas if p.status != Installment.Status.PAID]
    vencidas = [p for p in em_aberto if p.due_date < hoje]
    proxima = min((p.due_date for p in em_aberto), default=None)

    if total == ZERO:
        situacao = "sem_cobranca"
    elif pago >= total:
        situacao = "pago"
    elif vencidas:
        situacao = "atrasado"
    elif pago > ZERO:
        situacao = "parcial"
    else:
        situacao = "a_pagar"

    return {
        "total": total,
        "paid": pago,
        "remaining": restante,
        "installments_count": len(parcelas),
        "installments_paid": len(parcelas) - len(em_aberto),
        "overdue_count": len(vencidas),
        "next_due_date": proxima,
        "situation": situacao,
    }


def _requirements_view(participant: Participant) -> dict:
    status = list(participant.requirement_status.all())
    obrigatorios = [s for s in status if s.requirement.required]
    pendentes = [s.requirement.name for s in obrigatorios if not s.delivered]
    return {
        "total": len(status),
        "delivered": sum(1 for s in status if s.delivered),
        "required_total": len(obrigatorios),
        "required_pending": pendentes,
        "all_required_delivered": not pendentes,
        "items": [
            {
                "id": s.id,
                "requirement_id": s.requirement_id,
                "name": s.requirement.name,
                "required": s.requirement.required,
                "delivered": s.delivered,
            }
            for s in status
        ],
    }


def build_roster(trip: Trip) -> list[dict]:
    """Uma linha por participante, com pagamento e requisitos consolidados."""
    hoje = dt.date.today()
    participantes = (
        trip.participants.prefetch_related(
            "payments__installments", "requirement_status__requirement"
        )
        .all()
    )
    linhas = []
    for p in participantes:
        pagamento = _payment_view(p, hoje)
        requisitos = _requirements_view(p)
        linhas.append(
            {
                "id": p.id,
                "name": p.name,
                "email": p.email,
                "phone": p.phone,
                "status": p.status,
                "is_minor": p.is_minor,
                "guardian_name": p.guardian_name,
                "guardian_phone": p.guardian_phone,
                "shirt_size": p.shirt_size,
                "boarding_point": p.boarding_point,
                "room_group": p.room_group,
                "dietary_restrictions": p.dietary_restrictions,
                "medical_notes": p.medical_notes,
                "payment": pagamento,
                "requirements": requisitos,
            }
        )
    return linhas


def build_summary(roster: list[dict], trip: Trip) -> dict:
    """Números do topo do painel: quem pagou, quem deve, o que falta entregar."""
    def conta(situacao: str) -> int:
        return sum(1 for linha in roster if linha["payment"]["situation"] == situacao)

    total_esperado = sum((linha["payment"]["total"] for linha in roster), ZERO)
    total_recebido = sum((linha["payment"]["paid"] for linha in roster), ZERO)

    return {
        "participants": len(roster),
        "capacity": trip.capacity,
        "spots_left": (
            None
            if trip.capacity is None
            else max(
                trip.capacity
                - sum(1 for linha in roster if linha["status"] != "cancelled"),
                0,
            )
        ),
        "paid": conta("pago"),
        "partial": conta("parcial"),
        "to_pay": conta("a_pagar"),
        "overdue": conta("atrasado"),
        "minors": sum(1 for linha in roster if linha["is_minor"]),
        "pending_requirements": sum(
            1 for linha in roster if not linha["requirements"]["all_required_delivered"]
        ),
        "total_expected": total_esperado,
        "total_received": total_recebido,
        "total_remaining": max(total_esperado - total_recebido, ZERO),
    }
