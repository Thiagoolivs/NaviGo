# 🚀 Deploy — NaviGo

Guia para publicar o NaviGo para **testes**. Arquitetura de deploy:

- **API (Django)** → **Railway** (via Docker) + **PostgreSQL** (plugin)
- **PWA (Ionic/Vite)** → **Vercel** ou **Netlify** (estático), apontando para a API

> Estado: pronto para um deploy de teste. PSP e IA seguem em `dummy`; e-mails
> saem no log até configurar o Resend.

---

## 1. API no Railway

1. **New Project → Deploy from GitHub repo** e selecione o repositório.
2. No serviço, defina **Root Directory = `api`**.
   ⚠️ **Este passo é obrigatório.** Sem ele o Railway tenta detectar o projeto na
   raiz do repositório (que é um monorepo) e o build falha antes de começar.
   Com o Root Directory correto, ele usa o `api/Dockerfile` (declarado também em
   `api/railway.json`).
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
- Raiz: `https://SEU-API.up.railway.app/` → JSON com os endpoints disponíveis
- Saúde: `https://SEU-API.up.railway.app/api/v1/health/` → `{"status":"ok",...}`

> ℹ️ Este serviço é **só a API**. Abrir o domínio no navegador mostra o JSON
> acima — a interface é o PWA, publicado separadamente (passo 2).
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

## 4. Se o deploy falhar

| Sintoma no log | Causa provável | O que fazer |
|----------------|----------------|-------------|
| `Nixpacks was unable to generate a build plan` / build nem inicia | **Root Directory** não está como `api` | Ajuste em Settings → Root Directory |
| `no such file or directory: requirements.txt` | Build rodando a partir da raiz do repo | Mesma correção acima |
| `ModuleNotFoundError` ao subir | Dependência nova sem regenerar o `requirements.txt` | Rode `uv export --no-dev --format requirements-txt --no-emit-project -o requirements.txt` e commite |
| `Bad Request (400)` em toda requisição | `DisallowedHost` — o domínio não está em `ALLOWED_HOSTS` | Já corrigido: os domínios `*.railway.app` e `*.up.railway.app` são sempre aceitos. Para domínio próprio, adicione-o em `DJANGO_ALLOWED_HOSTS` |
| `404` ao abrir o domínio | Rota inexistente | Já corrigido: a raiz `/` agora lista os endpoints. Lembre que a interface é o PWA, publicado à parte |
| `CSRF verification failed` no PWA | Origem do front não confiável | Adicione a URL do PWA em `CSRF_TRUSTED_ORIGINS` e em `CORS_ALLOWED_ORIGINS` |
| Erro de conexão com o banco | Plugin PostgreSQL ausente | Adicione o plugin (ele injeta `DATABASE_URL`) |
| Falha em `collectstatic` no build | Variável faltando | O build já passa `DJANGO_SECRET_KEY=build-only`; verifique alterações no `settings.py` |

> A imagem usa **apenas pip e a imagem oficial do Python** — sem depender de um
> segundo registry para instalar dependências.

---

## 5. Checklist de produção (além do teste)

- [ ] `DJANGO_DEBUG=false` e `DJANGO_SECRET_KEY` forte
- [ ] `CORS_ALLOWED_ORIGINS` apenas com a origem do PWA
- [ ] E-mail real (Resend) e `ACCOUNT_EMAIL_VERIFICATION=mandatory`
- [ ] PSP de PIX e provedor de IA definidos (sair do `dummy`)
- [ ] Backups do PostgreSQL
