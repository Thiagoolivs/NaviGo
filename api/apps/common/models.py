from django.db import models


class TimestampedModel(models.Model):
    """Base com created_at/updated_at para todos os modelos do domínio."""

    created_at = models.DateTimeField("criado em", auto_now_add=True)
    updated_at = models.DateTimeField("atualizado em", auto_now=True)

    class Meta:
        abstract = True
