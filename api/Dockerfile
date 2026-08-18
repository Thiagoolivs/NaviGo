# Imagem de produção da API do NaviGo (Django + gunicorn).
FROM python:3.11-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy \
    DJANGO_SETTINGS_MODULE=navigo.settings \
    # Usa o venv diretamente: evita que `uv run` tente re-sincronizar
    # (e reinstalar dependências de dev) durante o build e no start.
    PATH="/app/.venv/bin:$PATH"

WORKDIR /app

# uv (gerenciador de dependências)
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

# Dependências primeiro — aproveita o cache de camadas
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev

# Código da aplicação
COPY . .

# Coleta os arquivos estáticos (não precisa de banco).
# DJANGO_DEBUG=false garante o storage comprimido do WhiteNoise.
RUN DJANGO_DEBUG=false DJANGO_SECRET_KEY=build-only python manage.py collectstatic --noinput

EXPOSE 8000

# Migra e sobe o servidor. O Railway injeta $PORT.
CMD ["sh", "-c", "python manage.py migrate --noinput && exec gunicorn navigo.wsgi:application --bind 0.0.0.0:${PORT:-8000} --workers 3 --timeout 60 --access-logfile -"]
