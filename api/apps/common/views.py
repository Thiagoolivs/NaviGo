from django.http import HttpRequest, JsonResponse


def health(_request: HttpRequest) -> JsonResponse:
    """Endpoint de verificação de saúde da API."""
    return JsonResponse({"status": "ok", "service": "navigo-api", "version": "0.1.0"})


def index(_request: HttpRequest) -> JsonResponse:
    """Raiz da API.

    Abrir o domínio direto é a primeira coisa que se faz ao publicar; sem esta
    rota o servidor responde 404 e parece que o deploy quebrou.
    """
    return JsonResponse(
        {
            "service": "navigo-api",
            "status": "ok",
            "endpoints": {
                "health": "/api/v1/health/",
                "api": "/api/v1/",
                "admin": "/admin/",
            },
        }
    )
