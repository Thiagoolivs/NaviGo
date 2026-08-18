"""Fábrica do PSP: resolve a implementação a partir de settings.PAYMENT_PROVIDER."""

from __future__ import annotations

from django.conf import settings

from .asaas import AsaasError, AsaasPaymentProvider
from .base import Payer, PaymentEvent, PaymentProvider, PixCharge
from .dummy import DummyPaymentProvider

__all__ = [
    "AsaasError",
    "AsaasPaymentProvider",
    "DummyPaymentProvider",
    "PaymentEvent",
    "PaymentProvider",
    "Payer",
    "PixCharge",
    "get_payment_provider",
]


def get_payment_provider() -> PaymentProvider:
    provider = getattr(settings, "PAYMENT_PROVIDER", "dummy")
    if provider == "dummy":
        return DummyPaymentProvider()
    if provider == "asaas":
        return AsaasPaymentProvider()
    raise NotImplementedError(f"PSP '{provider}' não suportado.")
