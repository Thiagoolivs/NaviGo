"""Cálculo de rateio — o "coração financeiro" do NaviGo.

Função pura (sem dependência do banco) para facilitar os testes. Regra:

    valor_por_participante =
        (Σ custos fixos / nº de participantes) + Σ custos por pessoa

acrescido da margem de segurança (percentual).
"""

from __future__ import annotations

from dataclasses import dataclass
from decimal import ROUND_HALF_UP, Decimal


@dataclass(frozen=True)
class CostLine:
    """Uma linha de custo do orçamento."""

    amount: Decimal
    per_person: bool = False


def compute_price_per_participant(
    lines: list[CostLine],
    participants: int,
    safety_margin_percent: Decimal = Decimal("0"),
) -> Decimal:
    """Retorna o valor por participante, arredondado a 2 casas."""
    if participants <= 0:
        raise ValueError("O número de participantes deve ser maior que zero.")

    fixed = sum((line.amount for line in lines if not line.per_person), Decimal("0"))
    per_person = sum((line.amount for line in lines if line.per_person), Decimal("0"))

    base = (fixed / Decimal(participants)) + per_person
    total = base * (Decimal("1") + Decimal(safety_margin_percent) / Decimal("100"))
    return total.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
