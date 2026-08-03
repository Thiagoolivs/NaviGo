"""
Configurações do Django para a API do NaviGo.

Valores sensíveis e específicos de ambiente vêm de variáveis de ambiente
(ver `.env.example`). Em desenvolvimento, sem `DATABASE_URL`, usa SQLite.
"""

from pathlib import Path

import environ

BASE_DIR = Path(__file__).resolve().parent.parent

env = environ.Env(
    DJANGO_DEBUG=(bool, False),
    DJANGO_ALLOWED_HOSTS=(list, ["localhost", "127.0.0.1"]),
    CORS_ALLOWED_ORIGINS=(list, ["http://localhost:5173"]),
)

# Lê um arquivo .env se existir (não versionado).
env_file = BASE_DIR / ".env"
if env_file.exists():
    env.read_env(str(env_file))

# --- Segurança / básico -----------------------------------------------------
SECRET_KEY = env("DJANGO_SECRET_KEY", default="dev-insecure-change-me")
DEBUG = env("DJANGO_DEBUG")
ALLOWED_HOSTS = env("DJANGO_ALLOWED_HOSTS")

# --- Aplicações -------------------------------------------------------------
DJANGO_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "django.contrib.sites",
]

THIRD_PARTY_APPS = [
    "rest_framework",
    "rest_framework.authtoken",
    "corsheaders",
    "anymail",
    "allauth",
    "allauth.account",
    "allauth.socialaccount",
    "allauth.socialaccount.providers.google",
    "dj_rest_auth",
    "dj_rest_auth.registration",
]

LOCAL_APPS = [
    "apps.common",
    "apps.accounts",
    "apps.trips",
    "apps.participants",
    "apps.payments",
    "apps.notifications",
    "apps.ai",
]

INSTALLED_APPS = DJANGO_APPS + THIRD_PARTY_APPS + LOCAL_APPS

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "allauth.account.middleware.AccountMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "navigo.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "navigo.wsgi.application"
ASGI_APPLICATION = "navigo.asgi.application"

# --- Banco de dados ---------------------------------------------------------
# Usa DATABASE_URL quando definido (ex.: postgres em produção); senão, SQLite.
DATABASES = {
    "default": env.db(
        "DATABASE_URL",
        default=f"sqlite:///{BASE_DIR / 'db.sqlite3'}",
    )
}

# --- Autenticação -----------------------------------------------------------
AUTH_USER_MODEL = "accounts.User"

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

# --- API (DRF) --------------------------------------------------------------
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "dj_rest_auth.jwt_auth.JWTCookieAuthentication",
        "rest_framework.authentication.SessionAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticatedOrReadOnly",
    ],
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 20,
}

# --- CORS (para o PWA) ------------------------------------------------------
CORS_ALLOWED_ORIGINS = env("CORS_ALLOWED_ORIGINS")
# O PWA envia o cookie de autenticação (JWT httpOnly).
CORS_ALLOW_CREDENTIALS = True

# --- Autenticação: allauth + dj-rest-auth -----------------------------------
SITE_ID = 1

AUTHENTICATION_BACKENDS = [
    "django.contrib.auth.backends.ModelBackend",
    "allauth.account.auth_backends.AuthenticationBackend",
]

# Login por e-mail; o username é gerado automaticamente a partir do e-mail.
ACCOUNT_LOGIN_METHODS = {"email"}
ACCOUNT_SIGNUP_FIELDS = ["email*", "password1*", "password2*"]
ACCOUNT_USER_MODEL_USERNAME_FIELD = "username"
# "optional" (dev) não bloqueia o cadastro; use "mandatory" em produção.
ACCOUNT_EMAIL_VERIFICATION = env("ACCOUNT_EMAIL_VERIFICATION", default="optional")

# JWT em cookie httpOnly (mais seguro que guardar token no PWA).
REST_AUTH = {
    "USE_JWT": True,
    "JWT_AUTH_COOKIE": "navigo-auth",
    "JWT_AUTH_REFRESH_COOKIE": "navigo-refresh",
    "JWT_AUTH_HTTPONLY": True,
    "JWT_AUTH_SAMESITE": "Lax",
    "SESSION_LOGIN": False,
    "REGISTER_SERIALIZER": "apps.accounts.serializers.NaviGoRegisterSerializer",
}

# Login social — Google. As credenciais são definidas depois, via ambiente:
#   GOOGLE_OAUTH_CLIENT_ID / GOOGLE_OAUTH_CLIENT_SECRET
# O endpoint já existe em /api/v1/auth/google/.
SOCIALACCOUNT_PROVIDERS = {
    "google": {
        "APP": {
            "client_id": env("GOOGLE_OAUTH_CLIENT_ID", default=""),
            "secret": env("GOOGLE_OAUTH_CLIENT_SECRET", default=""),
            "key": "",
        },
        "SCOPE": ["profile", "email"],
        "AUTH_PARAMS": {"access_type": "online"},
    }
}

# --- E-mail (caminho para o Resend via Anymail) -----------------------------
# Dev: imprime no console. Produção: aponte EMAIL_BACKEND para o Resend:
#   EMAIL_BACKEND=anymail.backends.resend.EmailBackend
#   RESEND_API_KEY=...
EMAIL_BACKEND = env(
    "EMAIL_BACKEND", default="django.core.mail.backends.console.EmailBackend"
)
DEFAULT_FROM_EMAIL = env("DEFAULT_FROM_EMAIL", default="NaviGo <nao-responder@navigo.app>")
ANYMAIL = {"RESEND_API_KEY": env("RESEND_API_KEY", default="")}

# --- Celery (jobs assíncronos) ----------------------------------------------
CELERY_BROKER_URL = env("CELERY_BROKER_URL", default="redis://localhost:6379/0")
CELERY_RESULT_BACKEND = env("CELERY_RESULT_BACKEND", default="redis://localhost:6379/1")
CELERY_TASK_ALWAYS_EAGER = env.bool("CELERY_TASK_ALWAYS_EAGER", default=DEBUG)

# --- Integrações (definidas depois: PSP de PIX e provedor de IA) -------------
# Selecionam a implementação concreta por trás das interfaces em apps.payments
# e apps.ai. Enquanto não definidos, usam os stubs "dummy".
PAYMENT_PROVIDER = env("PAYMENT_PROVIDER", default="dummy")
AI_PROVIDER = env("AI_PROVIDER", default="dummy")

# --- Internacionalização ----------------------------------------------------
LANGUAGE_CODE = "pt-br"
TIME_ZONE = "America/Sao_Paulo"
USE_I18N = True
USE_TZ = True

# --- Arquivos estáticos -----------------------------------------------------
STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"
