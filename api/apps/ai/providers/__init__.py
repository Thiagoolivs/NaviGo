"""Fábrica do assistente de IA: resolve a implementação por settings.AI_PROVIDER."""

from __future__ import annotations

from django.conf import settings

from .base import AiAssistant, TripStructureSuggestion
from .dummy import DummyAiAssistant

__all__ = ["AiAssistant", "TripStructureSuggestion", "get_ai_assistant"]


def get_ai_assistant() -> AiAssistant:
    provider = getattr(settings, "AI_PROVIDER", "dummy")
    if provider == "dummy":
        return DummyAiAssistant()
    # TODO: implementar anthropic / openai quando o provedor for escolhido.
    raise NotImplementedError(f"Provedor de IA '{provider}' ainda não implementado.")
