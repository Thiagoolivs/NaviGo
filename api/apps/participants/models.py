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

    class ShirtSize(models.TextChoices):
        PP = "PP", "PP"
        P = "P", "P"
        M = "M", "M"
        G = "G", "G"
        GG = "GG", "GG"
        XGG = "XGG", "XGG"

    trip = models.ForeignKey(Trip, on_delete=models.CASCADE, related_name="participants")
    # A inscrição pode ocorrer sem conta (user nulo no MVP).
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
    document = models.CharField("documento (CPF/RG)", max_length=40, blank=True)
    birth_date = models.DateField("data de nascimento", null=True, blank=True)
    status = models.CharField(
        "status", max_length=20, choices=Status.choices, default=Status.REGISTERED
    )

    # --- Menores de idade (essencial em excursão escolar e de igreja) -------
    is_minor = models.BooleanField("menor de idade", default=False)
    guardian_name = models.CharField("responsável", max_length=140, blank=True)
    guardian_phone = models.CharField("telefone do responsável", max_length=32, blank=True)
    guardian_document = models.CharField("documento do responsável", max_length=40, blank=True)

    # --- Saúde e logística --------------------------------------------------
    emergency_contact = models.CharField("contato de emergência", max_length=140, blank=True)
    health_insurance = models.CharField("plano de saúde", max_length=140, blank=True)
    dietary_restrictions = models.CharField("restrição alimentar", max_length=200, blank=True)
    medical_notes = models.TextField("observações médicas / medicamentos", blank=True)
    shirt_size = models.CharField(
        "tamanho de camiseta", max_length=4, choices=ShirtSize.choices, blank=True
    )
    boarding_point = models.CharField("ponto de embarque", max_length=140, blank=True)
    room_group = models.CharField("quarto / grupo", max_length=60, blank=True)

    notes = models.TextField("observações", blank=True)

    # --- LGPD ---------------------------------------------------------------
    consent_accepted = models.BooleanField("aceitou os termos", default=False)
    consent_at = models.DateTimeField("aceite em", null=True, blank=True)

    class Meta:
        ordering = ["name"]

    def __str__(self) -> str:
        return self.name


class TripRequirement(TimestampedModel):
    """Item que o participante precisa entregar (autorização, RG, ficha médica...).

    É configurável por viagem porque cada contexto exige coisas diferentes —
    escola pede autorização dos responsáveis, igreja pede ficha de inscrição etc.
    """

    class AppliesTo(models.TextChoices):
        ALL = "all", "Todos"
        MINORS = "minors", "Somente menores"

    trip = models.ForeignKey(Trip, on_delete=models.CASCADE, related_name="requirements")
    name = models.CharField("item", max_length=140)
    description = models.CharField("descrição", max_length=250, blank=True)
    applies_to = models.CharField(
        "aplica-se a", max_length=10, choices=AppliesTo.choices, default=AppliesTo.ALL
    )
    required = models.BooleanField("obrigatório", default=True)
    order = models.PositiveIntegerField("ordem", default=0)

    class Meta:
        ordering = ["order", "id"]
        constraints = [
            models.UniqueConstraint(fields=["trip", "name"], name="unique_requirement_per_trip")
        ]

    def __str__(self) -> str:
        return self.name

    def applies_to_participant(self, participant: Participant) -> bool:
        return self.applies_to == self.AppliesTo.ALL or participant.is_minor


class ParticipantRequirement(TimestampedModel):
    """Entrega de um requisito por um participante."""

    participant = models.ForeignKey(
        Participant, on_delete=models.CASCADE, related_name="requirement_status"
    )
    requirement = models.ForeignKey(
        TripRequirement, on_delete=models.CASCADE, related_name="participant_status"
    )
    delivered = models.BooleanField("entregue", default=False)
    delivered_at = models.DateTimeField("entregue em", null=True, blank=True)
    notes = models.CharField("observação", max_length=250, blank=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["participant", "requirement"], name="unique_participant_requirement"
            )
        ]

    def __str__(self) -> str:
        return f"{self.requirement} — {self.participant}"


class Invite(TimestampedModel):
    """Convite público (link/QR) de uma viagem."""

    trip = models.OneToOneField(Trip, on_delete=models.CASCADE, related_name="invite")
    token = models.SlugField("token", max_length=64, unique=True)
    qr_code_url = models.URLField("QR Code", blank=True)
    expires_at = models.DateTimeField("expira em", null=True, blank=True)

    def __str__(self) -> str:
        return f"Convite de {self.trip}"
