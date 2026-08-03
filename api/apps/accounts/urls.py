from django.urls import include, path

from .views import GoogleLogin

# Montado sob /api/v1/auth/
urlpatterns = [
    # login, logout, user, troca/reset de senha
    path("", include("dj_rest_auth.urls")),
    # cadastro (registration) e verificação de e-mail
    path("registration/", include("dj_rest_auth.registration.urls")),
    # login social com Google
    path("google/", GoogleLogin.as_view(), name="google_login"),
]
