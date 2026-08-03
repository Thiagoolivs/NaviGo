from django.conf import settings
from django.db import models

from apps.common.models import TimestampedModel


class TripType(models.TextChoices):
    CHURCH = "church", "Igreja"
    SCHOOL = "school", "Escola"
    FAMILY = "family", "Família"
    FRIENDS = "friends", "Amigos"
    CORPORATE = "corporate", "Corporativa"
    EVENT = "event", "Evento"


class TripStatus(models.TextChoices):
    DRAFT = "draft", "Rascunho"
    PUBLISHED = "published", "Publicada"
    CLOSED = "closed", "Encerrada"
    ARCHIVED = "archived", "Arquivada"


class Trip(TimestampedModel):
    organizer = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="trips"
    )
    name = models.CharField("nome", max_length=140)
    destination = models.CharField("destino", max_length=200)
    type = models.CharField("tipo", max_length=20, choices=TripType.choices)
    start_date = models.DateField("início", null=True, blank=True)
    end_date = models.DateField("fim", null=True, blank=True)
    duration_days = models.PositiveIntegerField("duração (dias)", null=True, blank=True)
    capacity = models.PositiveIntegerField("limite de vagas", null=True, blank=True)
    slug = models.SlugField("slug", max_length=160, unique=True)
    status = models.CharField(
        "status", max_length=20, choices=TripStatus.choices, default=TripStatus.DRAFT
    )
    cover_image_url = models.URLField("imagem de capa", blank=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return self.name


class TripConfig(TimestampedModel):
    """Respostas do assistente de IA que definem a estrutura da viagem."""

    trip = models.OneToOneField(Trip, on_delete=models.CASCADE, related_name="config")
    has_lodging = models.BooleanField("tem hospedagem", default=False)
    has_meals = models.BooleanField("tem alimentação", default=False)
    has_chartered_transport = models.BooleanField("transporte fretado", default=False)
    has_rooms = models.BooleanField("tem quartos", default=False)
    has_groups = models.BooleanField("tem grupos", default=False)
    has_capacity_limit = models.BooleanField("tem limite de vagas", default=False)
    safety_margin_percent = models.DecimalField(
        "margem de segurança (%)", max_digits=5, decimal_places=2, default=0
    )

    def __str__(self) -> str:
        return f"Config de {self.trip}"


class BudgetCategory(models.TextChoices):
    TRANSPORT = "transport", "Transporte"
    LODGING = "lodging", "Hospedagem"
    MEALS = "meals", "Alimentação"
    TICKETS = "tickets", "Ingressos"
    EXTRA = "extra", "Extras"


class CostType(models.TextChoices):
    FIXED = "fixed", "Fixo (rateado)"
    PER_PERSON = "per_person", "Por pessoa"


class BudgetItem(TimestampedModel):
    trip = models.ForeignKey(Trip, on_delete=models.CASCADE, related_name="budget_items")
    category = models.CharField("categoria", max_length=20, choices=BudgetCategory.choices)
    description = models.CharField("descrição", max_length=200, blank=True)
    amount = models.DecimalField("valor", max_digits=12, decimal_places=2)
    cost_type = models.CharField(
        "tipo de custo", max_length=20, choices=CostType.choices, default=CostType.FIXED
    )

    def __str__(self) -> str:
        return f"{self.get_category_display()}: {self.amount}"


class Task(TimestampedModel):
    class Source(models.TextChoices):
        AI = "ai", "IA"
        MANUAL = "manual", "Manual"

    trip = models.ForeignKey(Trip, on_delete=models.CASCADE, related_name="tasks")
    title = models.CharField("título", max_length=200)
    description = models.TextField("descrição", blank=True)
    done = models.BooleanField("concluída", default=False)
    due_date = models.DateField("prazo", null=True, blank=True)
    source = models.CharField(max_length=10, choices=Source.choices, default=Source.MANUAL)

    class Meta:
        ordering = ["done", "due_date"]

    def __str__(self) -> str:
        return self.title
