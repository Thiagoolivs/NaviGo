"""Testes das rotas básicas e do acesso por domínio.

O deploy no Railway respondeu 400 (DisallowedHost) e 404 na raiz; estes testes
travam os dois comportamentos.
"""

import pytest
from django.conf import settings
from django.test import Client


def test_raiz_responde_em_vez_de_404(db):
    """Abrir o domínio direto deve responder algo útil, não 404."""
    resp = Client().get("/")
    assert resp.status_code == 200
    dados = resp.json()
    assert dados["service"] == "navigo-api"
    assert dados["endpoints"]["health"] == "/api/v1/health/"


def test_health(db):
    resp = Client().get("/api/v1/health/")
    assert resp.status_code == 200
    assert resp.json()["status"] == "ok"


@pytest.mark.parametrize(
    "host",
    [
        "navigoo.up.railway.app",  # domínio real que devolvia 400
        "qualquer-servico.up.railway.app",
        "outro.railway.app",
    ],
)
def test_dominio_do_railway_e_aceito(db, host):
    """Reproduz o 400 do deploy: o Host do Railway precisa ser aceito."""
    resp = Client().get("/", HTTP_HOST=host)
    assert resp.status_code == 200, f"{host} devolveu {resp.status_code}"


def test_host_desconhecido_continua_bloqueado(db):
    """A liberação é só para o Railway — não pode virar um curinga geral."""
    resp = Client().get("/", HTTP_HOST="site-malicioso.com")
    assert resp.status_code == 400


def test_origens_do_railway_sao_confiaveis_para_csrf():
    assert "https://*.up.railway.app" in settings.CSRF_TRUSTED_ORIGINS
