from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """Usuário do NaviGo (organizador e/ou participante).

    Mantém `username` como identificador do Django, mas exige e-mail único —
    o login por e-mail (social/magic link) será provido pelo django-allauth.
    """

    email = models.EmailField("endereço de e-mail", unique=True)
    phone = models.CharField("telefone", max_length=32, blank=True)
    avatar_url = models.URLField("avatar", blank=True)

    # --- Conta PIX do organizador ------------------------------------------
    # O participante paga direto ao organizador; aqui ficam a chave e o QR Code
    # que ele cadastra (podendo colar o "copia e cola" ou enviar a imagem).
    class PixKeyType(models.TextChoices):
        CPF = "cpf", "CPF"
        CNPJ = "cnpj", "CNPJ"
        EMAIL = "email", "E-mail"
        PHONE = "phone", "Telefone"
        RANDOM = "random", "Chave aleatória"

    pix_key = models.CharField("chave PIX", max_length=140, blank=True)
    pix_key_type = models.CharField(
        "tipo da chave", max_length=10, choices=PixKeyType.choices, blank=True
    )
    pix_owner_name = models.CharField("nome do favorecido", max_length=140, blank=True)
    pix_bank = models.CharField("instituição", max_length=80, blank=True)
    # Código "copia e cola" (BR Code). Quando presente, o QR é gerado a partir dele.
    pix_payload = models.TextField("PIX copia e cola", blank=True)
    # Imagem do QR enviada pelo organizador, como data URI (evita depender de
    # storage de arquivos — o disco do container é efêmero).
    pix_qr_image = models.TextField("imagem do QR Code", blank=True)

    def __str__(self) -> str:
        return self.get_full_name() or self.username

    @property
    def has_pix_account(self) -> bool:
        return bool(self.pix_payload or self.pix_qr_image or self.pix_key)
