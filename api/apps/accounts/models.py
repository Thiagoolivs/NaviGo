from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """Usuário do NaviGo (organizador e/ou participante).

    Mantém `username` como identificador do Django, mas exige e-mail único —
    o login por e-mail (social/magic link) será provido pelo django-allauth.
    """

    email = models.EmailField("endereço de e-mail", unique=True)
    phone = models.CharField("telefone", max_length=32, blank=True)
    pix_key = models.CharField("chave PIX", max_length=140, blank=True)
    avatar_url = models.URLField("avatar", blank=True)

    def __str__(self) -> str:
        return self.get_full_name() or self.username
