# 🚀 Deploy — NaviGo

Guia para publicar o NaviGo para **testes**.

**Um serviço só no Railway**: a imagem Docker da raiz compila a interface (PWA)
e o Django a serve junto com a API, no mesmo domínio. Banco pelo plugin
**PostgreSQL**.

> Estado: pronto para um deploy de teste. PSP e IA seguem em `dummy`; e-mails
> saem no log até configurar o Resend.

---

## 1. Tudo em um serviço no Railway

A imagem Docker da **raiz do repositório** compila a interface (PWA) e a serve
junto com a API — **um deploy, um domínio**. Sem CORS e sem cookie entre
origens.

1. **New Project → Deploy from GitHub repo** e selecione o repositório.
2. Em **Settings → Root Directory**, deixe **vazio** (a raiz do repositório).
   ⚠️ Se você já tinha um serviço com Root Directory = `api`, **limpe esse
   campo** — senão o Railway continua publicando só a API, sem a interface.
3. Adicione o plugin **PostgreSQL** (injeta `DATABASE_URL` automaticamente).
4. Em **Variables**, defina:

   | Variável | Valor |
   |----------|-------|
   | `DJANGO_SECRET_KEY` | uma chave secreta (veja abaixo) |
   | `DJANGO_DEBUG` | `false` |
   | `CELERY_TASK_ALWAYS_EAGER` | `true` *(evita precisar de Redis nos primeiros testes)* |
   | `ACCOUNT_EMAIL_VERIFICATION` | `optional` |

   Gere a `DJANGO_SECRET_KEY` com:
   ```bash
   python -c "import secrets; print(secrets.token_urlsafe(50))"
   ```

5. **Settings → Networking → Generate Domain**.
6. Deploy. O build compila o PWA, instala a API, aplica as migrações e sobe o
   gunicorn.

**O que fica disponível no domínio:**

| Endereço | O que é |
|----------|---------|
| `/` | **A interface** (painel do organizador) |
| `/trip/<slug>` | Página pública da viagem (link/QR do convite) |
| `/api/v1/health/` | Saúde da API |
| `/admin/` | Admin do Django |

Crie o superusuário no shell do serviço:
```bash
python manage.py createsuperuser
```

---

## 2. Publicar interface e API separadamente (opcional)

Se um dia quiser separar (por exemplo, colocar a interface numa CDN):

- **API:** um serviço com Root Directory = `api` e um Dockerfile próprio.
- **PWA:** Vercel/Netlify com Root Directory = `web`, build `npm run build`,
  saída `dist` e `VITE_API_URL=https://SUA-API/api/v1`.
- Nesse caso é obrigatório apontar `CORS_ALLOWED_ORIGINS` e
  `CSRF_TRUSTED_ORIGINS` na API para a URL da interface.

Para o MVP, o serviço único do passo 1 é mais simples.

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
| `Nixpacks was unable to generate a build plan` / build nem inicia | Root Directory apontando para uma subpasta | Deixe o **Root Directory vazio** (a raiz tem o `Dockerfile`) |
| Abre o domínio e aparece **JSON** em vez da interface | O serviço está publicando só a API (Root Directory = `api`) | Limpe o Root Directory e refaça o deploy |
| `ModuleNotFoundError` ao subir | Dependência nova sem regenerar o `requirements.txt` | Rode `uv export --no-dev --format requirements-txt --no-emit-project -o requirements.txt` e commite (há um teste que barra isso) |
| `Bad Request (400)` em toda requisição | `DisallowedHost` — o domínio não está em `ALLOWED_HOSTS` | Já corrigido: os domínios `*.railway.app` e `*.up.railway.app` são sempre aceitos. Para domínio próprio, adicione-o em `DJANGO_ALLOWED_HOSTS` |
| `404` ao recarregar uma página interna (ex.: `/login`) | Interface não copiada para a imagem | Confirme que o build usou o `Dockerfile` da raiz |
| `CSRF verification failed` no PWA | Origem do front não confiável | Adicione a URL do PWA em `CSRF_TRUSTED_ORIGINS` e em `CORS_ALLOWED_ORIGINS` |
| Erro de conexão com o banco | Plugin PostgreSQL ausente | Adicione o plugin (ele injeta `DATABASE_URL`) |
| Falha em `collectstatic` no build | Variável faltando | O build já passa `DJANGO_SECRET_KEY=build-only`; verifique alterações no `settings.py` |

> A imagem usa **apenas pip e a imagem oficial do Python** — sem depender de um
> segundo registry para instalar dependências.

---

## 5. Checklist de produção (além do teste)

- [ ] `DJANGO_DEBUG=false` e `DJANGO_SECRET_KEY` forte
- [ ] `CORS_ALLOWED_ORIGINS` só é necessário se a interface for publicada à parte
- [ ] E-mail real (Resend) e `ACCOUNT_EMAIL_VERIFICATION=mandatory`
- [ ] PSP de PIX e provedor de IA definidos (sair do `dummy`)
- [ ] Backups do PostgreSQL
