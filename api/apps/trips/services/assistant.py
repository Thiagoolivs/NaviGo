"""Serviços do assistente de viagem (IA)."""

from __future__ import annotations

from decimal import Decimal

from apps.ai.providers import TripStructureSuggestion, get_ai_assistant

from ..models import BudgetCategory, Task, Trip
from .pricing import CostLine, compute_price_per_participant

# Categorias aceitas — filtra qualquer coisa fora do domínio vinda da IA.
VALID_CATEGORIES = {c.value for c in BudgetCategory}


def build_answers(trip: Trip) -> dict[str, object]:
    """Monta o contexto enviado à IA a partir da viagem e da sua configuração."""
    config = getattr(trip, "config", None)
    answers: dict[str, object] = {
        "nome": trip.name,
        "destino": trip.destination,
        "tipo": trip.get_type_display(),
        "duracao_dias": trip.duration_days,
        "participantes": trip.capacity,
        "data_inicio": trip.start_date.isoformat() if trip.start_date else None,
    }
    if config is not None:
        answers.update(
            {
                "tem_hospedagem": config.has_lodging,
                "tem_alimentacao": config.has_meals,
                "transporte_fretado": config.has_chartered_transport,
                "tem_quartos": config.has_rooms,
                "tem_grupos": config.has_groups,
                "tem_limite_vagas": config.has_capacity_limit,
            }
        )
    return answers


def generate_structure(trip: Trip) -> TripStructureSuggestion:
    """Consulta a IA e devolve a sugestão (sem gravar nada)."""
    assistant = get_ai_assistant()
    return assistant.suggest_trip_structure(answers=build_answers(trip))


def apply_suggestion(trip: Trip, suggestion: TripStructureSuggestion) -> list[Task]:
    """Cria as tarefas sugeridas pela IA, sem duplicar as já existentes."""
    existing = set(trip.tasks.values_list("title", flat=True))
    novas = [
        Task(trip=trip, title=titulo[:200], source=Task.Source.AI)
        for titulo in suggestion.checklist
        if titulo not in existing
    ]
    return Task.objects.bulk_create(novas)


def valid_categories(suggestion: TripStructureSuggestion) -> list[str]:
    """Mantém apenas categorias de orçamento conhecidas pelo domínio."""
    return [c for c in suggestion.budget_categories if c in VALID_CATEGORIES]


def price_for_trip(trip: Trip, participants: int | None = None) -> dict[str, object]:
    """Calcula o rateio da viagem a partir dos itens de orçamento.

    A base de participantes é, nesta ordem: o valor informado, o limite de vagas
    da viagem ou o número de inscritos (mínimo 1).
    """
    base = participants or trip.capacity or trip.participants.count() or 1
    items = list(trip.budget_items.all())
    lines = [
        CostLine(amount=item.amount, per_person=item.cost_type == "per_person")
        for item in items
    ]
    config = getattr(trip, "config", None)
    margin = config.safety_margin_percent if config else Decimal("0")

    total_fixed = sum((i.amount for i in items if i.cost_type != "per_person"), Decimal("0"))
    total_per_person = sum((i.amount for i in items if i.cost_type == "per_person"), Decimal("0"))

    per_participant = (
        compute_price_per_participant(lines, base, margin) if lines else Decimal("0.00")
    )
    return {
        "participants": base,
        "safety_margin_percent": margin,
        "total_fixed": total_fixed,
        "total_per_person": total_per_person,
        "price_per_participant": per_participant,
        "estimated_total": per_participant * base,
    }
