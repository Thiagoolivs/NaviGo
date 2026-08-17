import pytest
from rest_framework.test import APIClient

from apps.accounts.models import User


@pytest.mark.django_db
def test_cadastro_por_email_cria_usuario():
    client = APIClient()
    resp = client.post(
        "/api/v1/auth/registration/",
        {
            "email": "org@example.com",
            "password1": "SenhaForte123!",
            "password2": "SenhaForte123!",
        },
        format="json",
    )
    assert resp.status_code in (201, 204), resp.content
    assert User.objects.filter(email="org@example.com").exists()


@pytest.mark.django_db
def test_login_apos_cadastro():
    client = APIClient()
    client.post(
        "/api/v1/auth/registration/",
        {
            "email": "login@example.com",
            "password1": "SenhaForte123!",
            "password2": "SenhaForte123!",
        },
        format="json",
    )
    resp = client.post(
        "/api/v1/auth/login/",
        {"email": "login@example.com", "password": "SenhaForte123!"},
        format="json",
    )
    assert resp.status_code == 200, resp.content
    # Com JWT em cookie httpOnly, o token de acesso é definido como cookie.
    assert "navigo-auth" in resp.cookies


@pytest.mark.django_db
def test_endpoint_google_existe():
    # Sem credenciais, deve responder (erro de credencial), não 404.
    client = APIClient()
    resp = client.post("/api/v1/auth/google/", {}, format="json")
    assert resp.status_code != 404
