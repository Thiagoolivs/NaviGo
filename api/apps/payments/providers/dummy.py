"""Stub de PSP para desenvolvimento, enquanto o provedor real não é escolhido.

Gera cobranças falsas e aceita qualquer webhook. NÃO usar em produção.
"""

from __future__ import annotations

import json
import uuid
from decimal import Decimal

from .base import PaymentEvent, PaymentProvider, PixCharge


class DummyPaymentProvider(PaymentProvider):
    def create_pix_charge(
        self, *, amount: Decimal, description: str, reference: str
    ) -> PixCharge:
        txid = uuid.uuid4().hex
        payload = f"PIX-DUMMY|{reference}|{amount}|{description}"
        return PixCharge(txid=txid, qr_code=payload, qr_code_image_url=None)

    def verify_webhook(self, *, headers: dict[str, str], body: bytes) -> bool:
        return True

    def parse_webhook(self, *, body: bytes) -> PaymentEvent:
        data = json.loads(body or b"{}")
        return PaymentEvent(txid=data.get("txid", ""), paid=bool(data.get("paid", False)))
