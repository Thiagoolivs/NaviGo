"""Interface do assistente de IA.

O provedor concreto (Anthropic Claude, OpenAI, ...) será decidido depois.
O sistema depende apenas desta interface — trocar de provedor é implementar
`AiAssistant` e apontar a variável AI_PROVIDER.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass, field


@dataclass
class TripStructureSuggestion:
    """Estrutura de viagem sugerida pela IA a partir das respostas do organizador."""

    checklist: list[str] = field(default_factory=list)
    budget_categories: list[str] = field(default_factory=list)
    notes: str = ""


class AiAssistant(ABC):
    @abstractmethod
    def suggest_trip_structure(self, *, answers: dict[str, object]) -> TripStructureSuggestion:
        """Recebe as respostas do assistente e sugere checklist e orçamento."""
