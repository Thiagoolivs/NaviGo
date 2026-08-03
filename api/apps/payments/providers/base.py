"""Interface de um PSP (provedor de pagamentos PIX).

O PSP concreto (Mercado Pago, Asaas, Pagar.me, ...) será decidido depois.
Todo o resto do sistema depende apenas desta interface — trocar de provedor
é implementar `PaymentProvider` e apontar a variável PAYMENT_PROVIDER.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass
from decimal import Decimal


@dataclass(frozen=True)
class PixCharge:
    """Cobrança PIX criada no PSP."""

    txid: str
    qr_code: str  # payload "copia e cola"
    qr_code_image_url: str | None = None


@dataclass(frozen=True)
class PaymentEvent:
    """Evento de pagamento recebido via webhook do PSP."""

    txid: str
    paid: bool


class PaymentProvider(ABC):
    @abstractmethod
    def create_pix_charge(
        self, *, amount: Decimal, description: str, reference: str
    ) -> PixCharge:
        """Cria uma cobrança PIX e retorna o QR Code."""

    @abstractmethod
    def verify_webhook(self, *, headers: dict[str, str], body: bytes) -> bool:
        """Valida a assinatura do webhook (segurança)."""

    @abstractmethod
    def parse_webhook(self, *, body: bytes) -> PaymentEvent:
        """Extrai o evento de pagamento do corpo do webhook."""
