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


@pytest.mark.django_db
def test_fluxo_completo_com_cookie_e_csrf():
    """Prova o caminho real do PWA: login por cookie + CSRF em requisição de escrita."""
    client = APIClient(enforce_csrf_checks=True)

    # 1) obtém o cookie csrftoken
    resp = client.get("/api/v1/auth/csrf/")
    assert resp.status_code == 200
    csrftoken = resp.cookies["csrftoken"].value

    # 2) cadastro (envia o header X-CSRFToken, como o PWA fará)
    resp = client.post(
        "/api/v1/auth/registration/",
        {
            "email": "cookie@example.com",
            "password1": "SenhaForte123!",
            "password2": "SenhaForte123!",
        },
        format="json",
        HTTP_X_CSRFTOKEN=csrftoken,
    )
    assert resp.status_code in (201, 204), resp.content

    # O Django ROTACIONA o csrftoken ao autenticar — o PWA precisa reler o
    # cookie a cada requisição (é o que o cliente do frontend faz).
    csrftoken = client.cookies["csrftoken"].value

    # 3) o cadastro devolve os tokens no corpo, mas quem define o cookie JWT
    #    é o login — por isso o PWA autentica logo após cadastrar.
    resp = client.post(
        "/api/v1/auth/login/",
        {"email": "cookie@example.com", "password": "SenhaForte123!"},
        format="json",
        HTTP_X_CSRFTOKEN=csrftoken,
    )
    assert resp.status_code == 200, resp.content
    assert "navigo-auth" in resp.cookies

    # 4) escrita autenticada apenas pelo cookie JWT + CSRF
    csrftoken = client.cookies["csrftoken"].value
    resp = client.post(
        "/api/v1/trips/",
        {"name": "Viagem via cookie", "destination": "Ubatuba", "type": "friends"},
        format="json",
        HTTP_X_CSRFTOKEN=csrftoken,
    )
    assert resp.status_code == 201, resp.content
    assert resp.json()["slug"] == "viagem-via-cookie"
