"""Requisitos (documentos/itens) que o participante precisa entregar.

Cada contexto exige coisas diferentes: excursão escolar depende de autorização
dos responsáveis, retiro de igreja costuma pedir ficha de inscrição e termo.
Os modelos abaixo são apenas um ponto de partida — o organizador pode editar,
remover ou acrescentar itens em qualquer viagem.
"""

from __future__ import annotations

from apps.trips.models import Trip, TripType

from ..models import Participant, ParticipantRequirement, TripRequirement

ALL = TripRequirement.AppliesTo.ALL
MINORS = TripRequirement.AppliesTo.MINORS

# (nome, descrição, aplica-se a, obrigatório)
Template = tuple[str, str, str, bool]

MODELOS: dict[str, list[Template]] = {
    TripType.SCHOOL: [
        (
            "Autorização dos responsáveis",
            "Assinada pelo pai/mãe ou responsável legal",
            MINORS,
            True,
        ),
        ("Cópia do documento", "RG, CPF ou certidão de nascimento", ALL, True),
        ("Ficha médica", "Alergias, medicamentos e plano de saúde", ALL, True),
        ("Termo de conduta", "Assinado pelo aluno e responsável", ALL, False),
    ],
    TripType.CHURCH: [
        ("Ficha de inscrição", "Preenchida e assinada", ALL, True),
        ("Autorização dos responsáveis", "Obrigatória para menores de 18 anos", MINORS, True),
        ("Cópia do documento", "RG ou CPF", ALL, False),
        ("Termo de responsabilidade", "Ciência das regras do retiro", ALL, False),
    ],
    TripType.CORPORATE: [
        ("Documento com foto", "RG ou CNH", ALL, True),
        ("Autorização da empresa", "Liberação do gestor", ALL, False),
    ],
}

# Usado para família, amigos e evento — mínimo indispensável.
PADRAO: list[Template] = [
    ("Documento com foto", "RG ou CNH", ALL, False),
    ("Autorização dos responsáveis", "Obrigatória para menores de 18 anos", MINORS, True),
]


def default_requirements(trip_type: str) -> list[Template]:
    return MODELOS.get(trip_type, PADRAO)


def ensure_default_requirements(trip: Trip) -> list[TripRequirement]:
    """Cria os requisitos padrão da viagem, se ela ainda não tiver nenhum."""
    if trip.requirements.exists():
        return list(trip.requirements.all())

    criados = TripRequirement.objects.bulk_create(
        [
            TripRequirement(
                trip=trip,
                name=nome,
                description=descricao,
                applies_to=aplica,
                required=obrigatorio,
                order=ordem,
            )
            for ordem, (nome, descricao, aplica, obrigatorio) in enumerate(
                default_requirements(trip.type)
            )
        ]
    )
    return criados


def sync_participant_requirements(participant: Participant) -> None:
    """Garante uma linha de status para cada requisito aplicável ao participante."""
    aplicaveis = [
        r
        for r in participant.trip.requirements.all()
        if r.applies_to_participant(participant)
    ]
    existentes = set(
        participant.requirement_status.values_list("requirement_id", flat=True)
    )
    ParticipantRequirement.objects.bulk_create(
        [
            ParticipantRequirement(participant=participant, requirement=r)
            for r in aplicaveis
            if r.id not in existentes
        ]
    )
    # Remove status de requisitos que deixaram de se aplicar (ex.: deixou de ser menor).
    ids_aplicaveis = {r.id for r in aplicaveis}
    participant.requirement_status.exclude(requirement_id__in=ids_aplicaveis).delete()
