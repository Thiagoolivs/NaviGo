from django.conf import settings
from django.http import FileResponse, Http404, HttpRequest, JsonResponse


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


def spa(_request: HttpRequest, path: str = "") -> FileResponse:
    """Entrega o index.html da interface.

    O PWA faz o roteamento no navegador, então qualquer caminho que não seja da
    API precisa devolver o index — senão recarregar a página em `/login` daria
    404 vindo do servidor.
    """
    index = settings.SPA_ROOT / "index.html"
    if not index.is_file():
        raise Http404("Interface não encontrada.")
    return FileResponse(index.open("rb"), content_type="text/html")
