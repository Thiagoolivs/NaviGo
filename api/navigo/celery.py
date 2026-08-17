"""Configuração do Celery para a API do NaviGo.

Uso:
    celery -A navigo worker -l info      # processa tarefas
    celery -A navigo beat -l info        # agenda tarefas periódicas
"""

import os

from celery import Celery

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "navigo.settings")

app = Celery("navigo")
app.config_from_object("django.conf:settings", namespace="CELERY")
app.autodiscover_tasks()
