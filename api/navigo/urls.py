"""Rotas raiz da API do NaviGo.

A API é versionada sob `/api/v1/`. Cada app registra suas próprias rotas.
"""

from django.contrib import admin
from django.urls import include, path

api_v1_patterns = [
    path("", include("apps.common.urls")),
    path("auth/", include("apps.accounts.urls")),
    path("", include("apps.trips.urls")),
    path("", include("apps.participants.urls")),
    path("", include("apps.payments.urls")),
]

urlpatterns = [
    path("admin/", admin.site.urls),
    # Sem namespace: nomes de URL de terceiros (ex.: allauth) precisam ser
    # reversíveis globalmente (account_confirm_email, etc.).
    path("api/v1/", include(api_v1_patterns)),
]
