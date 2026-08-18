"""Conta PIX do organizador — geração e validação do QR Code."""

from __future__ import annotations

import base64
import io

import qrcode

# Limite da imagem enviada pelo organizador (data URI base64).
MAX_QR_IMAGE_BYTES = 512 * 1024
ALLOWED_IMAGE_PREFIXES = ("data:image/png;base64,", "data:image/jpeg;base64,")


class InvalidQrImageError(ValueError):
    """A imagem enviada não é um QR Code válido para armazenar."""


def qr_data_uri(payload: str) -> str:
    """Gera a imagem do QR Code (PNG em data URI) a partir do copia e cola."""
    img = qrcode.make(payload)
    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    codificada = base64.b64encode(buffer.getvalue()).decode()
    return f"data:image/png;base64,{codificada}"


def validate_qr_image(data_uri: str) -> str:
    """Valida a imagem enviada pelo organizador (formato e tamanho)."""
    if not data_uri:
        return ""
    if not data_uri.startswith(ALLOWED_IMAGE_PREFIXES):
        raise InvalidQrImageError("Envie uma imagem PNG ou JPEG.")

    try:
        conteudo = base64.b64decode(data_uri.split(",", 1)[1], validate=True)
    except (IndexError, ValueError) as exc:
        raise InvalidQrImageError("Imagem inválida.") from exc

    if len(conteudo) > MAX_QR_IMAGE_BYTES:
        raise InvalidQrImageError("A imagem deve ter no máximo 512 KB.")
    return data_uri


def resolve_qr(user) -> str:
    """QR Code a exibir: o gerado do copia e cola ou a imagem enviada."""
    if user.pix_payload:
        return qr_data_uri(user.pix_payload)
    return user.pix_qr_image or ""
