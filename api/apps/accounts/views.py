from allauth.socialaccount.providers.google.views import GoogleOAuth2Adapter
from allauth.socialaccount.providers.oauth2.client import OAuth2Client
from dj_rest_auth.registration.views import SocialLoginView
from django.conf import settings
from django.http import HttpRequest, JsonResponse
from django.views.decorators.csrf import ensure_csrf_cookie


@ensure_csrf_cookie
def csrf(_request: HttpRequest) -> JsonResponse:
    """Entrega o cookie `csrftoken` ao PWA.

    Com JWT em cookie httpOnly, o dj-rest-auth valida CSRF nas requisições de
    escrita. O PWA chama este endpoint uma vez e depois envia o valor do cookie
    no header `X-CSRFToken`.
    """
    return JsonResponse({"detail": "CSRF cookie definido."})


class GoogleLogin(SocialLoginView):
    """Login com Google.

    O endpoint já existe; para funcionar, defina no ambiente:
    GOOGLE_OAUTH_CLIENT_ID e GOOGLE_OAUTH_CLIENT_SECRET (ver settings).
    """

    adapter_class = GoogleOAuth2Adapter
    client_class = OAuth2Client
    callback_url = getattr(settings, "GOOGLE_OAUTH_CALLBACK_URL", "postmessage")
