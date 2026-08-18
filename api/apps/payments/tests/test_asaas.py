import json
from decimal import Decimal

import pytest

from apps.payments.providers.asaas import AsaasError, AsaasPaymentProvider
from apps.payments.providers.base import Payer


class FakeResponse:
    def __init__(self, payload, status_code=200):
        self._payload = payload
        self.status_code = status_code
        self.text = json.dumps(payload)

    def json(self):
        return self._payload


@pytest.fixture
def provider():
    return AsaasPaymentProvider(
        api_key="chave-teste",
        api_url="https://api-sandbox.asaas.com/v3",
        webhook_token="token-secreto",
    )


def test_exige_api_key():
    with pytest.raises(AsaasError):
        AsaasPaymentProvider(api_key="", webhook_token="x")


def test_cria_cobranca_pix(provider, monkeypatch):
    chamadas = []

    def fake_request(method, url, headers=None, json=None, timeout=None):
        chamadas.append((method, url, json))
        if url.endswith("/customers") and method == "POST":
            return FakeResponse({"id": "cus_1"})
        if "/customers?" in url:
            return FakeResponse({"data": []})
        if url.endswith("/payments") and method == "POST":
            return FakeResponse({"id": "pay_1"})
        if url.endswith("/pixQrCode"):
            return FakeResponse({"payload": "000201-copia-e-cola", "encodedImage": "QUJD"})
        raise AssertionError(f"chamada inesperada: {method} {url}")

    monkeypatch.setattr("apps.payments.providers.asaas.requests.request", fake_request)

    charge = provider.create_pix_charge(
        amount=Decimal("150.00"),
        description="Retiro",
        reference="parcela-1",
        payer=Payer(name="Maria", cpf_cnpj="12345678909", email="maria@example.com"),
    )

    assert charge.txid == "pay_1"
    assert charge.qr_code == "000201-copia-e-cola"
    assert charge.qr_code_image_url.startswith("data:image/png;base64,")

    # a cobrança leva o externalReference para reconciliação
    payment_call = next(c for c in chamadas if c[1].endswith("/payments") and c[0] == "POST")
    assert payment_call[2]["externalReference"] == "parcela-1"
    assert payment_call[2]["billingType"] == "PIX"


def test_reaproveita_cliente_existente(provider, monkeypatch):
    def fake_request(method, url, headers=None, json=None, timeout=None):
        if "/customers?" in url:
            return FakeResponse({"data": [{"id": "cus_existente"}]})
        if url.endswith("/payments") and method == "POST":
            assert json["customer"] == "cus_existente"
            return FakeResponse({"id": "pay_2"})
        if url.endswith("/pixQrCode"):
            return FakeResponse({"payload": "x", "encodedImage": ""})
        raise AssertionError(f"chamada inesperada: {url}")

    monkeypatch.setattr("apps.payments.providers.asaas.requests.request", fake_request)
    charge = provider.create_pix_charge(
        amount=Decimal("10"),
        description="d",
        reference="r",
        payer=Payer(name="João", cpf_cnpj="12345678909"),
    )
    assert charge.txid == "pay_2"
    assert charge.qr_code_image_url is None


def test_erro_http_vira_asaas_error(provider, monkeypatch):
    monkeypatch.setattr(
        "apps.payments.providers.asaas.requests.request",
        lambda *a, **k: FakeResponse({"errors": ["invalid"]}, status_code=400),
    )
    with pytest.raises(AsaasError):
        provider.create_pix_charge(
            amount=Decimal("10"),
            description="d",
            reference="r",
            payer=Payer(name="X", cpf_cnpj="1"),
        )


def test_pagador_sem_cpf_e_recusado(provider):
    with pytest.raises(AsaasError):
        provider.create_pix_charge(
            amount=Decimal("10"), description="d", reference="r", payer=Payer(name="X")
        )


def test_webhook_valida_token(provider):
    assert provider.verify_webhook(headers={"asaas-access-token": "token-secreto"}, body=b"")
    assert not provider.verify_webhook(headers={"asaas-access-token": "errado"}, body=b"")
    assert not provider.verify_webhook(headers={}, body=b"")


def test_webhook_sem_token_configurado_recusa():
    aberto = AsaasPaymentProvider(api_key="k", webhook_token="")
    assert not aberto.verify_webhook(headers={"asaas-access-token": "qualquer"}, body=b"")


@pytest.mark.parametrize(
    "evento,esperado",
    [("PAYMENT_RECEIVED", True), ("PAYMENT_CONFIRMED", True), ("PAYMENT_OVERDUE", False)],
)
def test_parse_webhook(provider, evento, esperado):
    body = json.dumps({"event": evento, "payment": {"id": "pay_9"}}).encode()
    evt = provider.parse_webhook(body=body)
    assert evt.txid == "pay_9"
    assert evt.paid is esperado
