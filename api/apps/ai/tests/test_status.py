"""Detecção do provedor e endpoints de diagnóstico.

Definir apenas GEMINI_API_KEY não ativava o Gemini — o AI_PROVIDER continuava
em "dummy". Estes testes travam o comportamento corrigido.
"""

import json

import pytest
from django.test import override_settings
from rest_framework.test import APIClient

from apps.accounts.models import User
from apps.ai.providers import GeminiAiAssistant, get_ai_assistant
from apps.ai.providers.dummy import DummyAiAssistant


@pytest.fixture
def client(db) -> APIClient:
    user = User.objects.create_user(
        username="org", email="org@example.com", password="SenhaForte123!"
    )
    api = APIClient()
    api.force_authenticate(user)
    return api


# --- seleção do provedor ------------------------------------------------------

@override_settings(AI_PROVIDER="gemini", GEMINI_API_KEY="chave-teste")
def test_com_chave_usa_o_gemini():
    assert isinstance(get_ai_assistant(), GeminiAiAssistant)


@override_settings(AI_PROVIDER="dummy", GEMINI_API_KEY="")
def test_sem_chave_usa_o_stub():
    assert isinstance(get_ai_assistant(), DummyAiAssistant)


@override_settings(AI_PROVIDER="dummy", GEMINI_API_KEY="chave-teste")
def test_dummy_explicito_desliga_a_ia_mesmo_com_chave():
    """Permite desativar a IA sem apagar a chave do ambiente."""
    assert isinstance(get_ai_assistant(), DummyAiAssistant)


# --- /ai/status/ --------------------------------------------------------------

@override_settings(AI_PROVIDER="gemini", GEMINI_API_KEY="chave-teste",
                   GEMINI_MODEL="gemini-2.0-flash")
def test_status_mostra_o_gemini_configurado(client):
    resp = client.get("/api/v1/ai/status/")
    assert resp.status_code == 200
    dados = resp.json()
    assert dados["provider"] == "gemini"
    assert dados["model"] == "gemini-2.0-flash"
    assert dados["api_key_configured"] is True
    assert dados["ready"] is True
    # A chave nunca é exposta.
    assert "chave-teste" not in json.dumps(dados)


@override_settings(AI_PROVIDER="dummy", GEMINI_API_KEY="")
def test_status_avisa_quando_falta_a_chave(client):
    dados = client.get("/api/v1/ai/status/").json()
    assert dados["provider"] == "dummy"
    assert dados["api_key_configured"] is False
    assert "GEMINI_API_KEY" in dados["detail"]


def test_status_exige_autenticacao(db):
    assert APIClient().get("/api/v1/ai/status/").status_code in (401, 403)


# --- /ai/check/ ---------------------------------------------------------------

@override_settings(AI_PROVIDER="gemini", GEMINI_API_KEY="chave-teste")
def test_check_faz_uma_chamada_real_ao_provedor(client, monkeypatch):
    class FakeResponse:
        status_code = 200
        text = ""

        @staticmethod
        def json():
            return {
                "candidates": [
                    {
                        "content": {
                            "parts": [
                                {
                                    "text": json.dumps(
                                        {
                                            "checklist": ["Confirmar ônibus"],
                                            "budget_categories": ["transport"],
                                            "notes": "ok",
                                        }
                                    )
                                }
                            ]
                        }
                    }
                ]
            }

    monkeypatch.setattr(
        "apps.ai.providers.gemini.requests.post", lambda *a, **k: FakeResponse()
    )
    resp = client.post("/api/v1/ai/check/")
    assert resp.status_code == 200, resp.content
    dados = resp.json()
    assert dados["ok"] is True
    assert dados["checklist_sample"] == ["Confirmar ônibus"]


@override_settings(AI_PROVIDER="gemini", GEMINI_API_KEY="chave-invalida")
def test_check_reporta_a_falha_da_chave(client, monkeypatch):
    class Erro:
        status_code = 400
        text = '{"error": {"message": "API key not valid"}}'

        @staticmethod
        def json():
            return {}

    monkeypatch.setattr("apps.ai.providers.gemini.requests.post", lambda *a, **k: Erro())
    resp = client.post("/api/v1/ai/check/")
    assert resp.status_code == 503
    assert "API key not valid" in resp.json()["error"]
