from django.urls import path

from . import views

# Montado sob /api/v1/ai/
urlpatterns = [
    path("status/", views.status, name="ai-status"),
    path("check/", views.check, name="ai-check"),
]
