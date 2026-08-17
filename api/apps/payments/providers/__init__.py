"""Fábrica do PSP: resolve a implementação a partir de settings.PAYMENT_PROVIDER."""

from __future__ import annotations

from django.conf import settings

from .base import PaymentEvent, PaymentProvider, PixCharge
from .dummy import DummyPaymentProvider

__all__ = ["PaymentEvent", "PaymentProvider", "PixCharge", "get_payment_provider"]


def get_payment_provider() -> PaymentProvider:
    provider = getattr(settings, "PAYMENT_PROVIDER", "dummy")
    if provider == "dummy":
        return DummyPaymentProvider()
    # TODO: implementar mercadopago / asaas / pagarme quando o PSP for escolhido.
    raise NotImplementedError(f"PSP '{provider}' ainda não implementado.")
