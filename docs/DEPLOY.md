# 🚀 Deploy — NaviGo

Guia para publicar o NaviGo para **testes**. Arquitetura de deploy:

- **API (Django)** → **Railway** (via Docker) + **PostgreSQL** (plugin)
- **PWA (Ionic/Vite)** → **Vercel** ou **Netlify** (estático), apontando para a API

> Estado: pronto para um deploy de teste. PSP e IA seguem em `dummy`; e-mails
> saem no log até configurar o Resend.

---

## 1. API no Railway

1. **New Project → Deploy from GitHub repo** e selecione o repositório.
2. No serviço, defina **Root Directory = `api`** (o Railway usa o `api/Dockerfile`).
3. Adicione o plugin **PostgreSQL** (injeta `DATABASE_URL` automaticamente).
4. Em **Variables**, defina:

   | Variável | Valor |
   |----------|-------|
   | `DJANGO_SECRET_KEY` | uma chave secreta (veja abaixo) |
   | `DJANGO_DEBUG` | `false` |
   | `CELERY_TASK_ALWAYS_EAGER` | `true` *(evita precisar de Redis nos primeiros testes)* |
   | `CORS_ALLOWED_ORIGINS` | `https://SEU-PWA.vercel.app` |
   | `ACCOUNT_EMAIL_VERIFICATION` | `optional` |

   Gere a `DJANGO_SECRET_KEY` com:
   ```bash
   python -c "import secrets; print(secrets.token_urlsafe(50))"
   ```

5. **Settings → Networking → Generate Domain** (o Railway define `RAILWAY_PUBLIC_DOMAIN`, que o projeto libera sozinho em `ALLOWED_HOSTS`/`CSRF_TRUSTED_ORIGINS`).
6. Deploy. O container aplica as migrações e sobe o gunicorn.

**Testes rápidos:**
- Saúde: `https://SEU-API.up.railway.app/api/v1/health/` → `{"status":"ok",...}`
- Admin: crie um superusuário no shell do serviço:
  ```bash
  uv run python manage.py createsuperuser
  ```

---

## 2. PWA no Vercel/Netlify

1. Novo projeto a partir do repositório, **Root Directory = `web`**.
2. Build: `npm run build` · Output: `dist`.
3. Variável de ambiente: `VITE_API_URL = https://SEU-API.up.railway.app/api/v1`.
4. Deploy. Depois, ajuste `CORS_ALLOWED_ORIGINS` na API para a URL do PWA.

> Também é possível hospedar o PWA no Railway (serviço estático), mas Vercel/
> Netlify são mais simples para conteúdo estático.

---

## 3. Opcionais

- **E-mail real (Resend):** `EMAIL_BACKEND=anymail.backends.resend.EmailBackend`
  e `RESEND_API_KEY=...`. Sem isso, e-mails (ex.: reset de senha) aparecem no log.
- **Google login:** `GOOGLE_OAUTH_CLIENT_ID` e `GOOGLE_OAUTH_CLIENT_SECRET`.
- **Assistente de IA (Gemini):** `AI_PROVIDER=gemini` + `GEMINI_API_KEY=...`
  (opcional `GEMINI_MODEL`, padrão `gemini-2.0-flash`). Sem isso, o assistente
  usa o stub `dummy` — o app funciona, com um checklist genérico.
- **PIX (Asaas):** `PAYMENT_PROVIDER=asaas` + `ASAAS_API_KEY=...` e
  `ASAAS_API_URL` (sandbox por padrão). Configure o webhook no painel do Asaas
  apontando para a API e use o mesmo token em `ASAAS_WEBHOOK_TOKEN`.
- **Redis/Celery (quando houver tarefas assíncronas):** adicione o plugin Redis,
  defina `CELERY_BROKER_URL`/`CELERY_RESULT_BACKEND` e remova
  `CELERY_TASK_ALWAYS_EAGER`.

---

## 4. Checklist de produção (além do teste)

- [ ] `DJANGO_DEBUG=false` e `DJANGO_SECRET_KEY` forte
- [ ] `CORS_ALLOWED_ORIGINS` apenas com a origem do PWA
- [ ] E-mail real (Resend) e `ACCOUNT_EMAIL_VERIFICATION=mandatory`
- [ ] PSP de PIX e provedor de IA definidos (sair do `dummy`)
- [ ] Backups do PostgreSQL
