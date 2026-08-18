from decimal import Decimal

import pytest
from rest_framework.test import APIClient

from apps.accounts.models import User
from apps.ai.providers.base import TripStructureSuggestion
from apps.trips.models import BudgetItem, Trip, TripStatus


@pytest.fixture
def organizer(db) -> User:
    return User.objects.create_user(
        username="org", email="org@example.com", password="SenhaForte123!"
    )


@pytest.fixture
def client(organizer) -> APIClient:
    api = APIClient()
    api.force_authenticate(organizer)
    return api


def criar_viagem(client: APIClient, **extra) -> dict:
    payload = {
        "name": "Retiro de Carnaval",
        "destination": "Campos do Jordão",
        "type": "church",
        "duration_days": 3,
        "capacity": 40,
        **extra,
    }
    resp = client.post("/api/v1/trips/", payload, format="json")
    assert resp.status_code == 201, resp.content
    return resp.json()


def test_criar_viagem_gera_slug_e_config(client):
    data = criar_viagem(client)
    assert data["slug"] == "retiro-de-carnaval"
    assert data["config"] is not None
    assert data["participants_count"] == 0


def test_slug_nao_colide_entre_viagens(client):
    primeira = criar_viagem(client)
    segunda = criar_viagem(client)
    assert primeira["slug"] != segunda["slug"]


def test_organizador_so_ve_as_proprias_viagens(client, db):
    criar_viagem(client)
    outro = User.objects.create_user(
        username="outro", email="outro@example.com", password="SenhaForte123!"
    )
    outro_client = APIClient()
    outro_client.force_authenticate(outro)

    resp = outro_client.get("/api/v1/trips/")
    assert resp.status_code == 200
    assert resp.json()["count"] == 0


def test_pricing_calcula_rateio(client):
    viagem = criar_viagem(client)
    trip = Trip.objects.get(pk=viagem["id"])
    BudgetItem.objects.create(
        trip=trip, category="transport", amount=Decimal("4000"), cost_type="fixed"
    )
    BudgetItem.objects.create(
        trip=trip, category="meals", amount=Decimal("50"), cost_type="per_person"
    )

    resp = client.get(f"/api/v1/trips/{trip.pk}/pricing/?participants=40")
    assert resp.status_code == 200, resp.content
    data = resp.json()
    # 4000/40 = 100 (fixo) + 50 (por pessoa) = 150
    assert Decimal(data["price_per_participant"]) == Decimal("150.00")
    assert data["participants"] == 40


def test_pricing_rejeita_participantes_invalidos(client):
    viagem = criar_viagem(client)
    resp = client.get(f"/api/v1/trips/{viagem['id']}/pricing/?participants=0")
    assert resp.status_code == 400


def test_assistente_cria_checklist(client, monkeypatch):
    viagem = criar_viagem(client)

    def fake_structure(trip):
        return TripStructureSuggestion(
            checklist=["Confirmar ônibus", "Reservar pousada"],
            budget_categories=["transport", "lodging", "invalida"],
            notes="Atenção ao prazo do transporte.",
        )

    monkeypatch.setattr(
        "apps.trips.services.assistant.generate_structure", fake_structure
    )

    resp = client.post(f"/api/v1/trips/{viagem['id']}/assistant/", {}, format="json")
    assert resp.status_code == 200, resp.content
    data = resp.json()
    assert data["tasks_created"] == 2
    # categoria fora do domínio é descartada
    assert data["budget_categories"] == ["transport", "lodging"]

    trip = Trip.objects.get(pk=viagem["id"])
    assert trip.tasks.count() == 2
    assert all(t.source == "ai" for t in trip.tasks.all())


def test_assistente_nao_duplica_tarefas(client, monkeypatch):
    viagem = criar_viagem(client)
    monkeypatch.setattr(
        "apps.trips.services.assistant.generate_structure",
        lambda trip: TripStructureSuggestion(checklist=["Confirmar ônibus"]),
    )
    client.post(f"/api/v1/trips/{viagem['id']}/assistant/", {}, format="json")
    resp = client.post(f"/api/v1/trips/{viagem['id']}/assistant/", {}, format="json")

    assert resp.json()["tasks_created"] == 0
    assert Trip.objects.get(pk=viagem["id"]).tasks.count() == 1


def test_assistente_indisponivel_retorna_503(client, monkeypatch):
    viagem = criar_viagem(client)

    def explode(trip):
        raise RuntimeError("GEMINI_API_KEY não configurada.")

    monkeypatch.setattr("apps.trips.services.assistant.generate_structure", explode)
    resp = client.post(f"/api/v1/trips/{viagem['id']}/assistant/", {}, format="json")
    assert resp.status_code == 503


def test_pagina_publica_so_apos_publicar(client):
    viagem = criar_viagem(client)
    anonimo = APIClient()

    # rascunho: não aparece
    assert anonimo.get(f"/api/v1/public/trips/{viagem['slug']}/").status_code == 404

    client.post(f"/api/v1/trips/{viagem['id']}/publish/", {}, format="json")
    resp = anonimo.get(f"/api/v1/public/trips/{viagem['slug']}/")
    assert resp.status_code == 200, resp.content
    assert resp.json()["spots_left"] == 40
    assert Trip.objects.get(pk=viagem["id"]).status == TripStatus.PUBLISHED


def test_viagem_exige_autenticacao():
    assert APIClient().get("/api/v1/trips/").status_code in (401, 403)
