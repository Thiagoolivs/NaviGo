import json

import pytest

from apps.ai.providers.gemini import GeminiAiAssistant, GeminiError


class FakeResponse:
    def __init__(self, payload, status_code=200):
        self._payload = payload
        self.status_code = status_code
        self.text = json.dumps(payload)

    def json(self):
        return self._payload


def gemini_payload(data: dict) -> dict:
    """Monta a estrutura de resposta da API do Gemini."""
    return {"candidates": [{"content": {"parts": [{"text": json.dumps(data)}]}}]}


@pytest.fixture
def assistant():
    return GeminiAiAssistant(api_key="chave-teste", model="gemini-2.0-flash")


def test_exige_api_key():
    with pytest.raises(GeminiError):
        GeminiAiAssistant(api_key="")


def test_sugere_estrutura(assistant, monkeypatch):
    capturado = {}

    def fake_post(url, headers=None, json=None, timeout=None):
        capturado["url"] = url
        capturado["headers"] = headers
        capturado["body"] = json
        return FakeResponse(
            gemini_payload(
                {
                    "checklist": ["Confirmar ônibus", "  ", "Reservar pousada"],
                    "budget_categories": ["transport", "lodging"],
                    "notes": "Feche o transporte cedo.",
                }
            )
        )

    monkeypatch.setattr("apps.ai.providers.gemini.requests.post", fake_post)

    resultado = assistant.suggest_trip_structure(answers={"destino": "Ubatuba"})

    assert resultado.checklist == ["Confirmar ônibus", "Reservar pousada"]  # vazio removido
    assert resultado.budget_categories == ["transport", "lodging"]
    assert resultado.notes == "Feche o transporte cedo."
    # usa saída estruturada e envia a chave no header
    assert capturado["body"]["generationConfig"]["responseMimeType"] == "application/json"
    assert capturado["headers"]["x-goog-api-key"] == "chave-teste"
    assert "gemini-2.0-flash:generateContent" in capturado["url"]


def test_erro_http_vira_gemini_error(assistant, monkeypatch):
    monkeypatch.setattr(
        "apps.ai.providers.gemini.requests.post",
        lambda *a, **k: FakeResponse({"error": "quota"}, status_code=429),
    )
    with pytest.raises(GeminiError):
        assistant.suggest_trip_structure(answers={})


def test_resposta_malformada_vira_gemini_error(assistant, monkeypatch):
    monkeypatch.setattr(
        "apps.ai.providers.gemini.requests.post",
        lambda *a, **k: FakeResponse({"candidates": []}),
    )
    with pytest.raises(GeminiError):
        assistant.suggest_trip_structure(answers={})
