from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import InstallmentViewSet, PaymentViewSet

router = DefaultRouter()
router.register("payments", PaymentViewSet, basename="payment")
router.register("installments", InstallmentViewSet, basename="installment")

urlpatterns = [path("", include(router.urls))]
