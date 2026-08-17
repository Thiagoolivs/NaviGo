"""Pacote do projeto NaviGo.

Garante que o app do Celery seja carregado quando o Django iniciar, para que
o decorator @shared_task funcione em todos os apps.
"""

from .celery import app as celery_app

__all__ = ("celery_app",)
