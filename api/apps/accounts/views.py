from allauth.socialaccount.providers.google.views import GoogleOAuth2Adapter
from allauth.socialaccount.providers.oauth2.client import OAuth2Client
from dj_rest_auth.registration.views import SocialLoginView
from django.conf import settings
from django.http import HttpRequest, JsonResponse
from django.shortcuts import get_object_or_404
from django.views.decorators.csrf import ensure_csrf_cookie
from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.trips.models import Trip, TripStatus

from .serializers import PixAccountSerializer
from .services import resolve_qr


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


class PixAccountView(generics.RetrieveUpdateAPIView):
    """Conta PIX do organizador — cadastro do QR Code e da chave."""

    serializer_class = PixAccountSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


class PublicTripPaymentView(APIView):
    """Dados de pagamento que o participante vê na página da viagem.

    Expõe apenas o necessário para pagar: nome do favorecido, chave e QR Code.
    """

    permission_classes = [permissions.AllowAny]

    def get(self, request, slug: str):
        trip = get_object_or_404(Trip, slug=slug, status=TripStatus.PUBLISHED)
        organizador = trip.organizer
        return Response(
            {
                "trip": trip.name,
                "has_pix_account": organizador.has_pix_account,
                "pix_owner_name": organizador.pix_owner_name,
                "pix_key": organizador.pix_key,
                "pix_key_type": organizador.pix_key_type,
                "pix_bank": organizador.pix_bank,
                "pix_payload": organizador.pix_payload,
                "qr_code": resolve_qr(organizador),
            }
        )
