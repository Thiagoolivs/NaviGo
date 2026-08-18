from dj_rest_auth.registration.serializers import RegisterSerializer
from rest_framework import serializers

from .models import User
from .services import InvalidQrImageError, resolve_qr, validate_qr_image


class NaviGoRegisterSerializer(RegisterSerializer):
    """Cadastro apenas com e-mail e senha.

    Remove o campo `username` do cadastro — o allauth gera um automaticamente
    a partir do e-mail (ACCOUNT_USER_MODEL_USERNAME_FIELD).
    """

    username = None

    def get_cleaned_data(self):
        data = super().get_cleaned_data()
        data.pop("username", None)
        return data


class PixAccountSerializer(serializers.ModelSerializer):
    """Conta PIX do organizador (chave + QR Code)."""

    qr_code = serializers.SerializerMethodField()
    has_pix_account = serializers.BooleanField(read_only=True)

    class Meta:
        model = User
        fields = [
            "pix_key",
            "pix_key_type",
            "pix_owner_name",
            "pix_bank",
            "pix_payload",
            "pix_qr_image",
            "qr_code",
            "has_pix_account",
        ]

    def get_qr_code(self, user: User) -> str:
        """Imagem a exibir: gerada do copia e cola, ou a que foi enviada."""
        return resolve_qr(user)

    def validate_pix_qr_image(self, value: str) -> str:
        try:
            return validate_qr_image(value)
        except InvalidQrImageError as exc:
            raise serializers.ValidationError(str(exc)) from exc

    def validate(self, attrs: dict) -> dict:
        # Gerar o QR a partir de um copia e cola inválido produziria uma imagem
        # que ninguém consegue pagar — melhor recusar na hora.
        payload = attrs.get("pix_payload", self.instance.pix_payload if self.instance else "")
        if payload and len(payload.strip()) < 20:
            raise serializers.ValidationError(
                {"pix_payload": "O código copia e cola parece incompleto."}
            )
        return attrs
