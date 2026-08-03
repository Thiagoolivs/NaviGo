from allauth.socialaccount.providers.google.views import GoogleOAuth2Adapter
from allauth.socialaccount.providers.oauth2.client import OAuth2Client
from dj_rest_auth.registration.views import SocialLoginView
from django.conf import settings


class GoogleLogin(SocialLoginView):
    """Login com Google.

    O endpoint já existe; para funcionar, defina no ambiente:
    GOOGLE_OAUTH_CLIENT_ID e GOOGLE_OAUTH_CLIENT_SECRET (ver settings).
    """

    adapter_class = GoogleOAuth2Adapter
    client_class = OAuth2Client
    callback_url = getattr(settings, "GOOGLE_OAUTH_CALLBACK_URL", "postmessage")
