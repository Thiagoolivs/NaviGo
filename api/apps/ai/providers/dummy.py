"""Stub do assistente de IA, enquanto o provedor real não é escolhido.

Retorna um checklist básico determinístico (sem chamar nenhuma API externa).
"""

from __future__ import annotations

from .base import AiAssistant, TripStructureSuggestion


class DummyAiAssistant(AiAssistant):
    def suggest_trip_structure(self, *, answers: dict[str, object]) -> TripStructureSuggestion:
        checklist = [
            "Definir data limite de inscrição",
            "Confirmar transporte",
            "Reservar hospedagem",
            "Organizar lista de participantes",
            "Definir forma de pagamento (PIX)",
        ]
        if answers.get("has_meals"):
            checklist.append("Planejar refeições")
        if answers.get("has_rooms"):
            checklist.append("Montar a divisão de quartos")

        return TripStructureSuggestion(
            checklist=checklist,
            budget_categories=["transport", "lodging", "meals", "tickets", "extra"],
            notes="Sugestão placeholder — configure AI_PROVIDER para respostas reais.",
        )
