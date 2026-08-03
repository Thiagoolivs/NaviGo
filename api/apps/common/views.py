from django.http import HttpRequest, JsonResponse


def health(_request: HttpRequest) -> JsonResponse:
    """Endpoint de verificação de saúde da API."""
    return JsonResponse({"status": "ok", "service": "navigo-api", "version": "0.1.0"})
