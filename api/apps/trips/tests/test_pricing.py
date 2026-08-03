from decimal import Decimal

import pytest

from apps.trips.services.pricing import CostLine, compute_price_per_participant


def test_custo_fixo_e_rateado_entre_participantes():
    lines = [CostLine(Decimal("1000"), per_person=False)]
    assert compute_price_per_participant(lines, 10) == Decimal("100.00")


def test_custo_por_pessoa_nao_e_rateado():
    lines = [CostLine(Decimal("50"), per_person=True)]
    assert compute_price_per_participant(lines, 10) == Decimal("50.00")


def test_mistura_com_margem_de_seguranca():
    lines = [
        CostLine(Decimal("1000"), per_person=False),  # fixo -> 1000/10 = 100
        CostLine(Decimal("50"), per_person=True),  # por pessoa -> 50
    ]
    # base = 150; + 10% = 165.00
    assert compute_price_per_participant(lines, 10, Decimal("10")) == Decimal("165.00")


def test_arredondamento_para_dois_decimais():
    lines = [CostLine(Decimal("100"), per_person=False)]
    # 100/3 = 33.333... -> 33.33
    assert compute_price_per_participant(lines, 3) == Decimal("33.33")


def test_zero_participantes_gera_erro():
    with pytest.raises(ValueError):
        compute_price_per_participant([CostLine(Decimal("100"))], 0)
