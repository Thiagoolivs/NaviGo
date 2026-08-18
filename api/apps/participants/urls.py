from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    ParticipantRequirementViewSet,
    ParticipantViewSet,
    PublicEnrollmentView,
    TripRequirementViewSet,
    TripRosterView,
)

router = DefaultRouter()
router.register("participants", ParticipantViewSet, basename="participant")
router.register("trip-requirements", TripRequirementViewSet, basename="triprequirement")
router.register(
    "participant-requirements", ParticipantRequirementViewSet, basename="participantrequirement"
)

urlpatterns = [
    path("", include(router.urls)),
    # Painel de gestão (organizador)
    path("trips/<int:trip_id>/roster/", TripRosterView.as_view(), name="trip-roster"),
    # Inscrição pública (participante, via link/QR)
    path(
        "public/trips/<slug:slug>/enroll/",
        PublicEnrollmentView.as_view(),
        name="public-enroll",
    ),
]
