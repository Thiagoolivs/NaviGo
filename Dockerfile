# Imagem única do NaviGo: a interface (PWA) e a API no mesmo serviço.
#
# Etapa 1 compila o PWA; etapa 2 monta a API e serve os arquivos compilados.
# Assim tudo roda no mesmo domínio — sem CORS e sem cookie entre origens.

# --- Etapa 1: compila a interface -------------------------------------------
FROM node:22-slim AS web

WORKDIR /web
COPY web/package.json web/package-lock.json ./
RUN npm ci

COPY web/ ./
# Caminho relativo: a interface chama a API no mesmo domínio.
ENV VITE_API_URL=/api/v1
RUN npm run build


# --- Etapa 2: API + interface compilada -------------------------------------
FROM python:3.11-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    DJANGO_SETTINGS_MODULE=navigo.settings

WORKDIR /app

# Dependências primeiro — aproveita o cache de camadas
COPY api/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Código da API
COPY api/ ./

# Interface compilada na etapa anterior (o Django a serve em "/")
COPY --from=web /web/dist ./spa

# Estáticos do admin/DRF (não precisa de banco)
RUN DJANGO_DEBUG=false DJANGO_SECRET_KEY=build-only python manage.py collectstatic --noinput

EXPOSE 8000

CMD ["sh", "-c", "python manage.py migrate --noinput && exec gunicorn navigo.wsgi:application --bind 0.0.0.0:${PORT:-8000} --workers 3 --timeout 60 --access-logfile -"]
