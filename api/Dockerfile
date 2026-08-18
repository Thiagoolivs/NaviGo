# Imagem de produção da API do NaviGo (Django + gunicorn).
#
# Usa apenas pip e a imagem oficial do Python — sem depender de um segundo
# registry para o instalador de dependências. As versões vêm de
# requirements.txt (gerado a partir de uv.lock; ver README).
FROM python:3.11-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    DJANGO_SETTINGS_MODULE=navigo.settings

WORKDIR /app

# Dependências primeiro — aproveita o cache de camadas
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Código da aplicação
COPY . .

# Coleta os arquivos estáticos (não precisa de banco).
# DJANGO_DEBUG=false garante o storage comprimido do WhiteNoise.
RUN DJANGO_DEBUG=false DJANGO_SECRET_KEY=build-only python manage.py collectstatic --noinput

EXPOSE 8000

# Migra e sobe o servidor. O Railway injeta $PORT.
CMD ["sh", "-c", "python manage.py migrate --noinput && exec gunicorn navigo.wsgi:application --bind 0.0.0.0:${PORT:-8000} --workers 3 --timeout 60 --access-logfile -"]
