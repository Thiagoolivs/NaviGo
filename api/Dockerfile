# Imagem de produção da API do NaviGo (Django + gunicorn).
FROM python:3.11-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy

WORKDIR /app

# uv (gerenciador de dependências)
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

# Dependências primeiro — aproveita o cache de camadas
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev

# Código da aplicação
COPY . .

# Coleta os arquivos estáticos (não precisa de banco)
RUN uv run python manage.py collectstatic --noinput

EXPOSE 8000

# Aplica migrações e sobe o servidor. O Railway injeta $PORT.
CMD ["sh", "-c", "uv run python manage.py migrate --noinput && uv run gunicorn navigo.wsgi:application --bind 0.0.0.0:${PORT:-8000} --workers 3"]
