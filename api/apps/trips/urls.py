from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.accounts.views import PublicTripPaymentView

from .views import BudgetItemViewSet, PublicTripView, TaskViewSet, TripViewSet

router = DefaultRouter()
router.register("trips", TripViewSet, basename="trip")
router.register("budget-items", BudgetItemViewSet, basename="budgetitem")
router.register("tasks", TaskViewSet, basename="task")

urlpatterns = [
    path("", include(router.urls)),
    # Página pública da viagem (link/QR) — sem autenticação.
    path("public/trips/<slug:slug>/", PublicTripView.as_view(), name="public-trip"),
    path(
        "public/trips/<slug:slug>/payment/",
        PublicTripPaymentView.as_view(),
        name="public-trip-payment",
    ),
]
