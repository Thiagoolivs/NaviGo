"""Assistente de IA — Google Gemini.

Usa a API REST do Gemini (generativelanguage) pedindo **saída estruturada**
(JSON com schema), para não depender de "parsear texto solto".

Docs: https://ai.google.dev/gemini-api/docs
"""

from __future__ import annotations

import json
from typing import Any

import requests
from django.conf import settings

from .base import AiAssistant, TripStructureSuggestion

TIMEOUT_SECONDS = 30
API_BASE = "https://generativelanguage.googleapis.com/v1beta/models"

# Schema da resposta — garante checklist/categorias em formato utilizável.
RESPONSE_SCHEMA = {
    "type": "object",
    "properties": {
        "checklist": {"type": "array", "items": {"type": "string"}},
        "budget_categories": {"type": "array", "items": {"type": "string"}},
        "notes": {"type": "string"},
    },
    "required": ["checklist", "budget_categories", "notes"],
}

SYSTEM_PROMPT = """Você é o assistente operacional do NaviGo, uma plataforma que
ajuda pessoas comuns (líderes de igreja, professores, famílias, grupos de amigos)
a organizar viagens em grupo no Brasil.

A partir das informações da viagem, gere:
- "checklist": tarefas práticas e específicas para o organizador, na ordem em que
  devem ser feitas. Entre 6 e 12 itens, cada um curto e acionável, em português.
- "budget_categories": as categorias de custo relevantes para esta viagem,
  escolhidas APENAS entre: transport, lodging, meals, tickets, extra.
- "notes": uma observação curta (1-2 frases) com o principal ponto de atenção.

Seja concreto e leve em conta o tipo de viagem, o destino e a duração."""


class GeminiError(RuntimeError):
    """Falha na comunicação com a API do Gemini."""


class GeminiAiAssistant(AiAssistant):
    def __init__(self, api_key: str | None = None, model: str | None = None) -> None:
        self.api_key = api_key if api_key is not None else settings.GEMINI_API_KEY
        self.model = model or settings.GEMINI_MODEL
        if not self.api_key:
            raise GeminiError("GEMINI_API_KEY não configurada.")

    def suggest_trip_structure(self, *, answers: dict[str, Any]) -> TripStructureSuggestion:
        dados = json.dumps(answers, ensure_ascii=False)
        prompt = f"{SYSTEM_PROMPT}\n\nDados da viagem (JSON):\n{dados}"

        url = f"{API_BASE}/{self.model}:generateContent"
        try:
            response = requests.post(
                url,
                headers={
                    "Content-Type": "application/json",
                    "x-goog-api-key": self.api_key,
                },
                json={
                    "contents": [{"parts": [{"text": prompt}]}],
                    "generationConfig": {
                        "responseMimeType": "application/json",
                        "responseSchema": RESPONSE_SCHEMA,
                        "temperature": 0.4,
                    },
                },
                timeout=TIMEOUT_SECONDS,
            )
        except requests.RequestException as exc:
            raise GeminiError(f"Falha ao chamar o Gemini: {exc}") from exc

        if response.status_code >= 400:
            raise GeminiError(f"Gemini respondeu {response.status_code}: {response.text}")

        return self._parse(response.json())

    @staticmethod
    def _parse(payload: dict[str, Any]) -> TripStructureSuggestion:
        try:
            text = payload["candidates"][0]["content"]["parts"][0]["text"]
            data = json.loads(text)
        except (KeyError, IndexError, TypeError, json.JSONDecodeError) as exc:
            raise GeminiError(f"Resposta inesperada do Gemini: {exc}") from exc

        checklist = [str(item) for item in data.get("checklist", []) if str(item).strip()]
        categories = [str(c) for c in data.get("budget_categories", []) if str(c).strip()]
        return TripStructureSuggestion(
            checklist=checklist,
            budget_categories=categories,
            notes=str(data.get("notes", "")),
        )
