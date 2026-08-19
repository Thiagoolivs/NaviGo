"""Diagnóstico do assistente de IA.

Permite conferir, direto em produção, se o provedor está configurado — sem
expor a chave e sem precisar criar uma viagem para descobrir.
"""

from __future__ import annotations

from django.conf import settings
from rest_framework import permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.request import Request
from rest_framework.response import Response

from .providers import get_ai_assistant


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def status(request: Request) -> Response:
    """Situação do assistente: provedor ativo, modelo e se a chave existe."""
    provider = getattr(settings, "AI_PROVIDER", "dummy")
    tem_chave = bool(getattr(settings, "GEMINI_API_KEY", ""))

    pronto, detalhe = True, "Assistente pronto."
    try:
        get_ai_assistant()
    except Exception as exc:
        pronto, detalhe = False, str(exc)

    if provider == "dummy":
        detalhe = (
            "Usando respostas genéricas. Defina GEMINI_API_KEY para ativar o Gemini."
        )

    return Response(
        {
            "provider": provider,
            "model": getattr(settings, "GEMINI_MODEL", "") if provider == "gemini" else "",
            "api_key_configured": tem_chave,
            "ready": pronto,
            "detail": detalhe,
        }
    )


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def check(request: Request) -> Response:
    """Faz uma chamada real ao provedor, para validar a chave de ponta a ponta."""
    try:
        assistente = get_ai_assistant()
        sugestao = assistente.suggest_trip_structure(
            answers={
                "nome": "Viagem de teste",
                "destino": "Serra Negra, SP",
                "tipo": "Igreja",
                "duracao_dias": 2,
                "participantes": 20,
            }
        )
    except Exception as exc:
        return Response({"ok": False, "error": str(exc)}, status=503)

    return Response(
        {
            "ok": True,
            "provider": getattr(settings, "AI_PROVIDER", "dummy"),
            "checklist_sample": sugestao.checklist[:5],
            "notes": sugestao.notes,
        }
    )
