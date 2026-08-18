"""PSP de PIX — Asaas.

Fluxo de cobrança:
1. `POST /customers`  — garante um cliente no Asaas para o participante;
2. `POST /payments`   — cria a cobrança com billingType=PIX;
3. `GET  /payments/{id}/pixQrCode` — obtém o QR Code (imagem + copia e cola).

Webhook: o Asaas envia eventos (`PAYMENT_RECEIVED`, `PAYMENT_CONFIRMED`, ...)
com o header `asaas-access-token`, que deve bater com ASAAS_WEBHOOK_TOKEN.

Docs: https://docs.asaas.com/
"""

from __future__ import annotations

import datetime as dt
import json
from decimal import Decimal
from typing import Any

import requests
from django.conf import settings

from .base import Payer, PaymentEvent, PaymentProvider, PixCharge

# Eventos que significam "dinheiro entrou".
PAID_EVENTS = {"PAYMENT_RECEIVED", "PAYMENT_CONFIRMED"}

TIMEOUT_SECONDS = 20


class AsaasError(RuntimeError):
    """Falha na comunicação com o Asaas."""


class AsaasPaymentProvider(PaymentProvider):
    def __init__(
        self,
        api_key: str | None = None,
        api_url: str | None = None,
        webhook_token: str | None = None,
    ) -> None:
        self.api_key = api_key if api_key is not None else settings.ASAAS_API_KEY
        self.api_url = (api_url or settings.ASAAS_API_URL).rstrip("/")
        self.webhook_token = (
            webhook_token if webhook_token is not None else settings.ASAAS_WEBHOOK_TOKEN
        )
        if not self.api_key:
            raise AsaasError("ASAAS_API_KEY não configurada.")

    # --- infra HTTP ---------------------------------------------------------
    def _headers(self) -> dict[str, str]:
        return {
            "access_token": self.api_key,
            "Content-Type": "application/json",
            "User-Agent": "NaviGo",
        }

    def _request(self, method: str, path: str, payload: dict[str, Any] | None = None) -> Any:
        url = f"{self.api_url}{path}"
        try:
            response = requests.request(
                method,
                url,
                headers=self._headers(),
                json=payload,
                timeout=TIMEOUT_SECONDS,
            )
        except requests.RequestException as exc:  # rede indisponível, timeout...
            raise AsaasError(f"Falha ao chamar o Asaas ({path}): {exc}") from exc

        if response.status_code >= 400:
            raise AsaasError(f"Asaas respondeu {response.status_code} em {path}: {response.text}")
        return response.json()

    # --- API do PaymentProvider --------------------------------------------
    def ensure_customer(self, *, name: str, cpf_cnpj: str, email: str = "") -> str:
        """Cria (ou reaproveita) o cliente no Asaas e devolve o id."""
        existing = self._request("GET", f"/customers?cpfCnpj={cpf_cnpj}")
        data = existing.get("data") or []
        if data:
            return str(data[0]["id"])

        created = self._request(
            "POST",
            "/customers",
            {"name": name, "cpfCnpj": cpf_cnpj, "email": email or None},
        )
        return str(created["id"])

    def create_pix_charge(
        self,
        *,
        amount: Decimal,
        description: str,
        reference: str,
        payer: Payer | None = None,
        due_date: dt.date | None = None,
    ) -> PixCharge:
        """Cria a cobrança PIX e devolve o QR Code.

        `reference` vai como externalReference — usamos para reconciliar.
        """
        if payer is None or not payer.cpf_cnpj:
            raise AsaasError("O Asaas exige o pagador com CPF/CNPJ para gerar a cobrança.")

        customer_id = self.ensure_customer(
            name=payer.name, cpf_cnpj=payer.cpf_cnpj, email=payer.email
        )
        due = due_date or dt.date.today()
        payment = self._request(
            "POST",
            "/payments",
            {
                "customer": customer_id,
                "billingType": "PIX",
                "value": float(amount),
                "dueDate": due.isoformat(),
                "description": description,
                "externalReference": reference,
            },
        )
        payment_id = str(payment["id"])

        qr = self._request("GET", f"/payments/{payment_id}/pixQrCode")
        encoded = qr.get("encodedImage") or ""
        return PixCharge(
            txid=payment_id,
            qr_code=qr.get("payload", ""),
            qr_code_image_url=f"data:image/png;base64,{encoded}" if encoded else None,
        )

    def verify_webhook(self, *, headers: dict[str, str], body: bytes) -> bool:
        """Confere o token que o Asaas envia no header do webhook."""
        if not self.webhook_token:
            # Sem token configurado não há como validar — recuse por segurança.
            return False
        received = headers.get("asaas-access-token") or headers.get("Asaas-Access-Token") or ""
        return received == self.webhook_token

    def parse_webhook(self, *, body: bytes) -> PaymentEvent:
        try:
            data = json.loads(body or b"{}")
        except json.JSONDecodeError as exc:
            raise AsaasError(f"Webhook do Asaas com JSON inválido: {exc}") from exc

        payment = data.get("payment") or {}
        return PaymentEvent(
            txid=str(payment.get("id", "")),
            paid=data.get("event") in PAID_EVENTS,
        )
