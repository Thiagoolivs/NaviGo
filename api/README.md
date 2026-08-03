# NaviGo — API

Backend do NaviGo: **Python + Django + DRF**. Expõe a API sob `/api/v1/` para o
PWA (`../web`).

## Rodar em desenvolvimento

```bash
uv sync                                   # cria .venv e instala deps
cp .env.example .env                      # ajuste se necessário
uv run python manage.py migrate
uv run python manage.py runserver         # http://localhost:8000
```

Sem `DATABASE_URL` no `.env`, usa **SQLite** (basta para começar). Para Postgres,
suba o `docker-compose` na raiz e aponte `DATABASE_URL`.

Health check: `GET http://localhost:8000/api/v1/health/`.

## Comandos úteis

| Comando | O quê |
|---------|-------|
| `uv run pytest` | Testes (inclui o cálculo de rateio) |
| `uv run ruff check .` | Lint |
| `uv run mypy .` | Checagem de tipos |
| `uv run python manage.py makemigrations` | Gera migrações |
| `uv run python manage.py createsuperuser` | Cria admin (`/admin/`) |
| `celery -A navigo worker -l info` | Worker de tarefas (requer Redis) |

## Estrutura

```
api/
├── navigo/            # settings, urls, celery, asgi/wsgi
├── apps/
│   ├── common/        # base (TimestampedModel) + health
│   ├── accounts/      # User customizado
│   ├── trips/         # Trip, TripConfig, BudgetItem, Task + serviço de rateio
│   ├── participants/  # Participant, Invite
│   ├── payments/      # Payment, Installment + providers/ (PSP)
│   ├── notifications/ # Notification, PushSubscription
│   └── ai/            # providers/ (assistente de IA)
└── pyproject.toml
```

## Integrações (a definir)

O **PSP de PIX** e o **provedor de IA** ficam atrás de interfaces, com stubs
`dummy` por padrão:

- `apps/payments/providers/` — `PaymentProvider` + `get_payment_provider()`
- `apps/ai/providers/` — `AiAssistant` + `get_ai_assistant()`

Para plugar um provedor real, implemente a interface e ajuste `PAYMENT_PROVIDER`
/ `AI_PROVIDER` no `.env`. Nenhuma outra parte do sistema precisa mudar.
