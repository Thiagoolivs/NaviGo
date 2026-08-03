from django.conf import settings
from django.db import models

from apps.common.models import TimestampedModel


class Notification(TimestampedModel):
    class Channel(models.TextChoices):
        EMAIL = "email", "E-mail"
        WHATSAPP = "whatsapp", "WhatsApp"
        PUSH = "push", "Web Push"

    class Status(models.TextChoices):
        PENDING = "pending", "Pendente"
        SENT = "sent", "Enviada"
        FAILED = "failed", "Falhou"

    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="notifications"
    )
    channel = models.CharField("canal", max_length=20, choices=Channel.choices)
    type = models.CharField("tipo", max_length=60)
    status = models.CharField(
        "status", max_length=20, choices=Status.choices, default=Status.PENDING
    )
    sent_at = models.DateTimeField("enviada em", null=True, blank=True)

    def __str__(self) -> str:
        return f"{self.get_channel_display()} → {self.recipient} ({self.type})"


class PushSubscription(TimestampedModel):
    """Assinatura de Web Push de um dispositivo/navegador (PWA).

    É dado pessoal (LGPD): permitir revogação e remover em logout/exclusão.
    """

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="push_subscriptions"
    )
    endpoint = models.TextField("endpoint")
    p256dh = models.CharField("chave p256dh", max_length=255)
    auth = models.CharField("chave auth", max_length=255)
    user_agent = models.CharField("user agent", max_length=255, blank=True)
    last_used_at = models.DateTimeField("último uso", null=True, blank=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["user", "endpoint"], name="unique_push_endpoint")
        ]

    def __str__(self) -> str:
        return f"Push de {self.user}"
