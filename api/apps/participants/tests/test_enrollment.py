from decimal import Decimal

import pytest
from rest_framework.test import APIClient

from apps.accounts.models import User
from apps.participants.models import Participant, TripRequirement
from apps.participants.services.enrollment import split_amount
from apps.payments.models import Installment
from apps.trips.models import BudgetItem, Trip, TripStatus


@pytest.fixture
def organizer(db) -> User:
    return User.objects.create_user(
        username="org", email="org@example.com", password="SenhaForte123!"
    )


@pytest.fixture
def trip(organizer) -> Trip:
    """Excursão escolar publicada, com orçamento que dá R$ 150,00 por pessoa."""
    t = Trip.objects.create(
        organizer=organizer,
        name="Excursão do 9º ano",
        destination="Petrópolis",
        type="school",
        capacity=40,
        slug="excursao-9-ano",
        status=TripStatus.PUBLISHED,
    )
    BudgetItem.objects.create(trip=t, category="transport", amount=Decimal("4000"),
                              cost_type="fixed")
    BudgetItem.objects.create(trip=t, category="meals", amount=Decimal("50"),
                              cost_type="per_person")
    return t


@pytest.fixture
def client(organizer) -> APIClient:
    api = APIClient()
    api.force_authenticate(organizer)
    return api


FICHA = {
    "name": "Ana Souza",
    "email": "ana@example.com",
    "phone": "11999998888",
    "consent_accepted": True,
}


# --- divisão de valores ------------------------------------------------------

@pytest.mark.parametrize(
    "total,partes,esperado",
    [
        (Decimal("150.00"), 1, [Decimal("150.00")]),
        (Decimal("150.00"), 3, [Decimal("50.00")] * 3),
        (Decimal("100.00"), 3, [Decimal("33.34"), Decimal("33.33"), Decimal("33.33")]),
    ],
)
def test_split_amount_soma_exatamente_o_total(total, partes, esperado):
    parcelas = split_amount(total, partes)
    assert parcelas == esperado
    assert sum(parcelas) == total


# --- inscrição pública -------------------------------------------------------

def test_inscricao_publica_cria_participante_e_parcelas(trip, db):
    anonimo = APIClient()
    resp = anonimo.post(
        f"/api/v1/public/trips/{trip.slug}/enroll/",
        {**FICHA, "installments": 3},
        format="json",
    )
    assert resp.status_code == 201, resp.content
    dados = resp.json()

    assert Decimal(dados["total_amount"]) == Decimal("150.00")
    assert len(dados["installments"]) == 3
    assert sum(Decimal(p["amount"]) for p in dados["installments"]) == Decimal("150.00")
    assert dados["spots_left"] == 39

    participante = Participant.objects.get(email="ana@example.com")
    assert participante.consent_at is not None


def test_inscricao_exige_aceite_dos_termos(trip, db):
    resp = APIClient().post(
        f"/api/v1/public/trips/{trip.slug}/enroll/",
        {**FICHA, "consent_accepted": False},
        format="json",
    )
    assert resp.status_code == 400
    assert "consent_accepted" in resp.json()


def test_menor_de_idade_exige_responsavel(trip, db):
    resp = APIClient().post(
        f"/api/v1/public/trips/{trip.slug}/enroll/",
        {**FICHA, "is_minor": True},
        format="json",
    )
    assert resp.status_code == 400
    assert "guardian_name" in resp.json()


def test_viagem_em_rascunho_nao_aceita_inscricao(trip, db):
    trip.status = TripStatus.DRAFT
    trip.save()
    resp = APIClient().post(
        f"/api/v1/public/trips/{trip.slug}/enroll/", FICHA, format="json"
    )
    assert resp.status_code == 404


def test_vagas_esgotadas_bloqueiam_inscricao(trip, db):
    trip.capacity = 1
    trip.save()
    anonimo = APIClient()
    primeira = anonimo.post(
        f"/api/v1/public/trips/{trip.slug}/enroll/", FICHA, format="json"
    )
    assert primeira.status_code == 201

    segunda = anonimo.post(
        f"/api/v1/public/trips/{trip.slug}/enroll/",
        {**FICHA, "name": "Outro", "email": "outro@example.com"},
        format="json",
    )
    assert segunda.status_code == 409


# --- requisitos (autorização, documentos) ------------------------------------

def test_requisitos_de_escola_sao_criados_e_autorizacao_so_para_menores(trip, db):
    anonimo = APIClient()
    anonimo.post(f"/api/v1/public/trips/{trip.slug}/enroll/", FICHA, format="json")
    anonimo.post(
        f"/api/v1/public/trips/{trip.slug}/enroll/",
        {
            **FICHA,
            "name": "João (menor)",
            "email": "joao@example.com",
            "is_minor": True,
            "guardian_name": "Maria Souza",
        },
        format="json",
    )

    nomes = set(TripRequirement.objects.filter(trip=trip).values_list("name", flat=True))
    assert "Autorização dos responsáveis" in nomes
    assert "Ficha médica" in nomes

    adulto = Participant.objects.get(email="ana@example.com")
    menor = Participant.objects.get(email="joao@example.com")

    req_adulto = {s.requirement.name for s in adulto.requirement_status.all()}
    req_menor = {s.requirement.name for s in menor.requirement_status.all()}

    assert "Autorização dos responsáveis" not in req_adulto
    assert "Autorização dos responsáveis" in req_menor


# --- painel do organizador ---------------------------------------------------

def test_roster_consolida_pagamento_e_requisitos(trip, client, db):
    anonimo = APIClient()
    anonimo.post(
        f"/api/v1/public/trips/{trip.slug}/enroll/",
        {**FICHA, "installments": 2},
        format="json",
    )

    resp = client.get(f"/api/v1/trips/{trip.id}/roster/")
    assert resp.status_code == 200, resp.content
    dados = resp.json()

    resumo = dados["summary"]
    assert resumo["participants"] == 1
    assert resumo["to_pay"] == 1
    assert Decimal(resumo["total_expected"]) == Decimal("150.00")
    assert Decimal(resumo["total_received"]) == Decimal("0.00")
    assert resumo["pending_requirements"] == 1  # ninguém entregou nada ainda

    linha = dados["participants"][0]
    assert linha["payment"]["installments_count"] == 2
    assert linha["payment"]["situation"] == "a_pagar"
    assert linha["requirements"]["all_required_delivered"] is False


def test_roster_reflete_baixa_de_parcela(trip, client, db):
    APIClient().post(
        f"/api/v1/public/trips/{trip.slug}/enroll/",
        {**FICHA, "installments": 2},
        format="json",
    )
    parcela = Installment.objects.order_by("due_date").first()

    resp = client.post(f"/api/v1/installments/{parcela.id}/pay/")
    assert resp.status_code == 200, resp.content

    dados = client.get(f"/api/v1/trips/{trip.id}/roster/").json()
    linha = dados["participants"][0]
    assert linha["payment"]["situation"] == "parcial"
    assert Decimal(linha["payment"]["paid"]) == Decimal("75.00")
    assert Decimal(linha["payment"]["remaining"]) == Decimal("75.00")
    assert Decimal(dados["summary"]["total_received"]) == Decimal("75.00")


def test_replanejar_parcelas_preserva_o_que_ja_foi_pago(trip, client, db):
    APIClient().post(
        f"/api/v1/public/trips/{trip.slug}/enroll/",
        {**FICHA, "installments": 2},
        format="json",
    )
    parcela = Installment.objects.order_by("due_date").first()
    client.post(f"/api/v1/installments/{parcela.id}/pay/")

    pagamento_id = parcela.payment_id
    resp = client.post(
        f"/api/v1/payments/{pagamento_id}/replan/", {"installments": 3}, format="json"
    )
    assert resp.status_code == 200, resp.content
    dados = resp.json()

    # 1 parcela paga + 3 novas do saldo de 75,00
    assert len(dados["installments"]) == 4
    saldo = [p for p in dados["installments"] if p["status"] != "paid"]
    assert sum(Decimal(p["amount"]) for p in saldo) == Decimal("75.00")
    assert dados["status"] == "partially_paid"


def test_marcar_requisito_como_entregue(trip, client, db):
    APIClient().post(
        f"/api/v1/public/trips/{trip.slug}/enroll/", FICHA, format="json"
    )
    participante = Participant.objects.get(email="ana@example.com")
    status_req = participante.requirement_status.first()

    resp = client.patch(
        f"/api/v1/participant-requirements/{status_req.id}/",
        {"delivered": True},
        format="json",
    )
    assert resp.status_code == 200, resp.content
    assert resp.json()["delivered"] is True

    status_req.refresh_from_db()
    assert status_req.delivered_at is not None


def test_roster_exige_ser_o_organizador(trip, db):
    outro = User.objects.create_user(
        username="outro", email="outro@example.com", password="SenhaForte123!"
    )
    api = APIClient()
    api.force_authenticate(outro)
    assert api.get(f"/api/v1/trips/{trip.id}/roster/").status_code == 404
