import base64

import pytest
from rest_framework.test import APIClient

from apps.accounts.models import User
from apps.accounts.services import InvalidQrImageError, qr_data_uri, validate_qr_image
from apps.trips.models import Trip, TripStatus

# Um "copia e cola" PIX de exemplo (formato BR Code).
PAYLOAD = "00020126580014BR.GOV.BCB.PIX0136chave-exemplo-1234-5678-90ab5204000053039865802BR"

PNG_1PX = base64.b64encode(
    base64.b64decode(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="
    )
).decode()


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


# --- geração do QR -----------------------------------------------------------

def test_gera_qr_a_partir_do_copia_e_cola():
    uri = qr_data_uri(PAYLOAD)
    assert uri.startswith("data:image/png;base64,")
    # Precisa ser um PNG de verdade (assinatura do formato).
    conteudo = base64.b64decode(uri.split(",", 1)[1])
    assert conteudo[:8] == b"\x89PNG\r\n\x1a\n"


def test_imagem_enviada_precisa_ser_png_ou_jpeg():
    with pytest.raises(InvalidQrImageError):
        validate_qr_image("data:text/html;base64,PGgxPm9pPC9oMT4=")


def test_imagem_muito_grande_e_recusada():
    grande = "data:image/png;base64," + base64.b64encode(b"x" * (600 * 1024)).decode()
    with pytest.raises(InvalidQrImageError):
        validate_qr_image(grande)


# --- cadastro pelo organizador ----------------------------------------------

def test_organizador_cadastra_chave_e_copia_e_cola(client, organizer):
    resp = client.patch(
        "/api/v1/auth/pix-account/",
        {
            "pix_key": "org@example.com",
            "pix_key_type": "email",
            "pix_owner_name": "Igreja Batista Central",
            "pix_bank": "Banco do Brasil",
            "pix_payload": PAYLOAD,
        },
        format="json",
    )
    assert resp.status_code == 200, resp.content
    dados = resp.json()

    assert dados["has_pix_account"] is True
    # O QR é gerado a partir do copia e cola.
    assert dados["qr_code"].startswith("data:image/png;base64,")

    organizer.refresh_from_db()
    assert organizer.pix_owner_name == "Igreja Batista Central"


def test_organizador_pode_enviar_a_imagem_do_qr(client):
    resp = client.patch(
        "/api/v1/auth/pix-account/",
        {"pix_qr_image": f"data:image/png;base64,{PNG_1PX}", "pix_owner_name": "Maria"},
        format="json",
    )
    assert resp.status_code == 200, resp.content
    assert resp.json()["qr_code"] == f"data:image/png;base64,{PNG_1PX}"


def test_copia_e_cola_tem_prioridade_sobre_a_imagem(client):
    """Se os dois existem, vale o gerado do copia e cola (mais confiável)."""
    resp = client.patch(
        "/api/v1/auth/pix-account/",
        {"pix_payload": PAYLOAD, "pix_qr_image": f"data:image/png;base64,{PNG_1PX}"},
        format="json",
    )
    assert resp.status_code == 200
    assert resp.json()["qr_code"] != f"data:image/png;base64,{PNG_1PX}"


def test_copia_e_cola_incompleto_e_recusado(client):
    resp = client.patch("/api/v1/auth/pix-account/", {"pix_payload": "123"}, format="json")
    assert resp.status_code == 400
    assert "pix_payload" in resp.json()


def test_imagem_invalida_e_recusada_pela_api(client):
    resp = client.patch(
        "/api/v1/auth/pix-account/",
        {"pix_qr_image": "data:application/pdf;base64,AAAA"},
        format="json",
    )
    assert resp.status_code == 400
    assert "pix_qr_image" in resp.json()


def test_conta_pix_exige_autenticacao():
    assert APIClient().get("/api/v1/auth/pix-account/").status_code in (401, 403)


# --- o participante enxerga o QR --------------------------------------------

def test_participante_ve_o_qr_da_viagem_publicada(client, organizer, db):
    client.patch(
        "/api/v1/auth/pix-account/",
        {"pix_payload": PAYLOAD, "pix_owner_name": "Igreja Batista", "pix_key": "org@example.com"},
        format="json",
    )
    trip = Trip.objects.create(
        organizer=organizer,
        name="Retiro",
        destination="Serra",
        type="church",
        slug="retiro",
        status=TripStatus.PUBLISHED,
    )

    resp = APIClient().get(f"/api/v1/public/trips/{trip.slug}/payment/")
    assert resp.status_code == 200, resp.content
    dados = resp.json()
    assert dados["pix_owner_name"] == "Igreja Batista"
    assert dados["qr_code"].startswith("data:image/png;base64,")
    assert dados["has_pix_account"] is True


def test_viagem_em_rascunho_nao_expoe_dados_de_pagamento(organizer, db):
    trip = Trip.objects.create(
        organizer=organizer,
        name="Rascunho",
        destination="X",
        type="church",
        slug="rascunho",
        status=TripStatus.DRAFT,
    )
    assert APIClient().get(f"/api/v1/public/trips/{trip.slug}/payment/").status_code == 404


def test_sem_conta_pix_cadastrada_o_participante_recebe_aviso(organizer, db):
    trip = Trip.objects.create(
        organizer=organizer,
        name="Sem PIX",
        destination="X",
        type="church",
        slug="sem-pix",
        status=TripStatus.PUBLISHED,
    )
    dados = APIClient().get(f"/api/v1/public/trips/{trip.slug}/payment/").json()
    assert dados["has_pix_account"] is False
    assert dados["qr_code"] == ""
