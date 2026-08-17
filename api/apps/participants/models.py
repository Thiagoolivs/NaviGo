from django.conf import settings
from django.db import models

from apps.common.models import TimestampedModel
from apps.trips.models import Trip


class Participant(TimestampedModel):
    class Status(models.TextChoices):
        REGISTERED = "registered", "Inscrito"
        CONFIRMED = "confirmed", "Confirmado"
        CANCELLED = "cancelled", "Cancelado"
        WAITLISTED = "waitlisted", "Lista de espera"

    trip = models.ForeignKey(Trip, on_delete=models.CASCADE, related_name="participants")
    # Inscrição pode ocorrer sem conta (userpode ser nulo no MVP).
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="participations",
    )
    name = models.CharField("nome", max_length=140)
    email = models.EmailField("e-mail", blank=True)
    phone = models.CharField("telefone", max_length=32, blank=True)
    document = models.CharField("documento", max_length=40, blank=True)
    status = models.CharField(
        "status", max_length=20, choices=Status.choices, default=Status.REGISTERED
    )
    emergency_contact = models.CharField("contato de emergência", max_length=140, blank=True)
    notes = models.TextField("observações", blank=True)

    class Meta:
        ordering = ["name"]

    def __str__(self) -> str:
        return self.name


class Invite(TimestampedModel):
    """Convite público (link/QR) de uma viagem."""

    trip = models.OneToOneField(Trip, on_delete=models.CASCADE, related_name="invite")
    token = models.SlugField("token", max_length=64, unique=True)
    qr_code_url = models.URLField("QR Code", blank=True)
    expires_at = models.DateTimeField("expira em", null=True, blank=True)

    def __str__(self) -> str:
        return f"Convite de {self.trip}"
