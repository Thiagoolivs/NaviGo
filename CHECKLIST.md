# ✅ Checklist de Desenvolvimento — NaviGo

Checklist acionável para tirar o NaviGo do papel. Organizado por fases; cada
item é uma tarefa concreta. Marque `[x]` conforme concluir.

> **Arquitetura:** **PWA** (Ionic + React + TypeScript) consumindo uma **API em
> Python** (Django + DRF), num monorepo — uma base de código que roda no
> navegador (desktop/notebook) **e** instala no celular como app. Detalhes em
> [`docs/ARQUITETURA.md`](./docs/ARQUITETURA.md).
>
> **Legenda de prioridade:** 🔴 crítico para o MVP · 🟡 importante · 🟢 desejável
> **Convenção:** 🖥️ backend/API · 📱 frontend/PWA · Roadmap em [`docs/ROADMAP.md`](./docs/ROADMAP.md).

- [ ] **Fase 0** — Fundação do projeto
- [ ] **Fase 1** — MVP
- [ ] **Fase 2** — Plano Pro
- [ ] **Fase 3** — Plano Business
- [ ] **Fase 4** — Visão de longo prazo

---

## 🧱 Fase 0 — Fundação do Projeto

### Decisões e alinhamento
- [ ] 🔴 Validar/ajustar a stack em [`docs/ARQUITETURA.md`](./docs/ARQUITETURA.md)
- [ ] 🔴 Escolher o PSP de PIX (Mercado Pago, Asaas ou Pagar.me) e criar conta sandbox
- [ ] 🔴 Escolher o provedor de IA (Claude/OpenAI) e obter chave de API
- [ ] 🟡 Definir domínio e identidade visual básica (logo, cores, tipografia)
- [ ] 🟡 Escolher a licença do projeto

### Monorepo e ferramentas
- [ ] 🔴 Criar a estrutura de monorepo: `api/` (Python) + `web/` (PWA) + `docs/`
- [ ] 🔴 `docker-compose.yml` com PostgreSQL + Redis para desenvolvimento
- [ ] 🔴 Adicionar `.gitignore` (Python + Node), `.env.example` e READMEs por pasta
- [ ] 🟡 Convenção de commits (Conventional Commits) + template de PR
- [ ] 🟡 CI (GitHub Actions): lint, typecheck e testes de `api/` e `web/`

### 🖥️ Backend/API (Django + DRF)
- [ ] 🔴 `startproject` + apps (`accounts`, `trips`, `participants`, `payments`, `notifications`, `ai`)
- [ ] 🔴 Dependências com **uv** (ou Poetry) + `pyproject.toml`
- [ ] 🔴 **Ruff** (lint+format) + **mypy** + **pre-commit**
- [ ] 🔴 Traduzir o [modelo de dados](./docs/MODELO-DE-DADOS.md) em **Django models** + `migrate`
- [ ] 🔴 Configurar **DRF** + versionamento de API (`/api/v1`) + **CORS** para o PWA
- [ ] 🔴 Seed inicial (management command/fixtures)
- [ ] 🟡 **Celery + Redis** para tarefas assíncronas
- [ ] 🟡 **pytest** + `pytest-django` + `factory_boy`
- [ ] 🟢 Deploy da API (Railway/Render/Fly) com Gunicorn + workers Uvicorn

### 📱 Frontend/PWA (Ionic + React + Vite)
- [ ] 🔴 Inicializar app **Ionic React + TypeScript** (Vite)
- [ ] 🔴 Configurar **ESLint + Prettier** + checagem de tipos
- [ ] 🔴 Cliente da API (fetch/axios + React Query) e gestão de sessão/token
- [ ] 🔴 **PWA**: `manifest.webmanifest` + ícones + **service worker** (`vite-plugin-pwa`/Workbox)
- [ ] 🔴 Instalação no celular ("adicionar à tela inicial") + tela cheia testadas
- [ ] 🟡 Layout **mobile-first** e responsivo (funciona bem em desktop e celular)
- [ ] 🟡 Estado offline básico (shell em cache + mensagem de "sem conexão")
- [ ] 🟢 `capacitor.config.ts` preparado (empacotamento nativo futuro, sem reescrita)
- [ ] 🟢 Vitest + Testing Library

### Qualidade e observabilidade (base)
- [ ] 🟡 Playwright (e2e no PWA, incluindo viewport mobile)
- [ ] 🟢 Sentry (front e back) + analytics de produto

---

## 🚀 Fase 1 — MVP

> Escopo mínimo para organizar uma viagem real de ponta a ponta. Entregue como
> **PWA** desde o início (web + instalável no celular).

### 1. Autenticação e conta
- [x] 🔴 🖥️ Endpoints de cadastro/login (dj-rest-auth + django-allauth; JWT em cookie httpOnly)
- [x] 🔴 📱 Telas de login e cadastro *(recuperação de senha: endpoint pronto, tela pendente)*
- [ ] 🔴 Login social (Google) — *backend e caminho prontos; falta credenciais + botão funcional*
- [ ] 🟡 Perfil do organizador (nome, telefone, foto, dados PIX)
- [x] 🟡 Verificação de e-mail *(configurada como `optional` em dev)*

### 2. Criar viagem
- [ ] 🔴 🖥️ API de viagem: nome, destino, datas, duração, nº de participantes, tipo
- [ ] 🔴 📱 Fluxo de criação (formulário guiado, mobile-first)
- [ ] 🔴 Tipos pré-definidos (igreja, escola, família, amigos, corporativa, evento)
- [ ] 🟡 Upload de imagem de capa (Pillow + storage)
- [ ] 🟢 Rascunho vs. publicada (status da viagem)

### 3. Assistente Inteligente (IA)
- [ ] 🔴 🖥️ Serviço de IA (SDK anthropic/openai) que monta a estrutura da viagem
- [ ] 🔴 📱 Fluxo de perguntas guiadas (hospedagem? alimentação? transporte? quartos? grupos? vagas?)
- [ ] 🔴 Gerar **checklist automático** de tarefas por tipo de viagem
- [ ] 🟡 Sugerir itens de orçamento a partir das respostas
- [ ] 🟡 Guardrails: validar saída, limitar custo/tokens, fallback em falha
- [ ] 🟢 Sugerir cronograma/roteiro inicial

### 4. Orçamento e precificação
- [ ] 🔴 🖥️ Cadastro de custos por categoria (transporte, hospedagem, alimentação, ingressos, extras)
- [ ] 🔴 🖥️ **Cálculo do valor por participante** em camada de serviço pura (testável com pytest)
- [ ] 🔴 Margem de segurança + custo total
- [ ] 🔴 📱 Tela de orçamento com valor por pessoa em tempo real
- [ ] 🟡 Custos fixos (rateados) vs. por pessoa
- [ ] 🟢 Simulação de cenários (variação por nº de participantes)

### 5. Página pública e convites
- [ ] 🔴 🖥️ Endpoint público da viagem por `slug` + geração de convite
- [ ] 🔴 📱 Página pública (informações + inscrição), renderizável e compartilhável
- [ ] 🔴 Geração de **QR Code** do convite (lib no back ou front)
- [ ] 🔴 Formulário de inscrição do participante (dados + termos)
- [ ] 🟡 Controle de limite de vagas (fecha ao lotar)
- [ ] 🟢 Lista de espera quando esgotar

### 6. Participantes
- [ ] 🔴 🖥️ API de participantes + status (inscrito, confirmado, cancelado)
- [ ] 🔴 📱 Listagem e detalhe do participante
- [ ] 🟡 Cadastro manual pelo organizador
- [ ] 🟡 Campos personalizados (documento, contato de emergência, restrições)
- [ ] 🟢 Divisão em quartos/grupos

### 7. Pagamentos via PIX
- [ ] 🔴 🖥️ Integração com o PSP (sandbox → produção) atrás de uma interface própria
- [ ] 🔴 🖥️ Geração de **QR Code PIX** por parcela
- [ ] 🔴 🖥️ **Webhook** validado por assinatura e **idempotente** → baixa automática
- [ ] 🔴 🖥️ Controle de parcelas (valor, vencimento, status)
- [ ] 🔴 📱 Tela de pagamento do participante (QR + status) e painel de inadimplência
- [ ] 🟡 **Lembretes automáticos** de cobrança (tarefas Celery)
- [ ] 🟡 Conciliação e tratamento de estorno/falha
- [ ] 🟢 Comprovante/recibo de pagamento

### 8. Painel do organizador
- [ ] 🔴 🖥️ Agregações (arrecadado vs. meta, vagas, inadimplência) via ORM
- [ ] 🔴 📱 Dashboard: participantes, vagas restantes, pagamentos, tarefas
- [ ] 🟡 Repositório de documentos da viagem
- [ ] 🟢 Indicadores/gráficos financeiros básicos

### 9. Notificações
- [ ] 🔴 🖥️ E-mail transacional (Resend/SES) via Celery *(caminho pronto: `EMAIL_BACKEND` console/Resend)*
- [ ] 🟡 📱 **Web Push** (VAPID): pedir permissão, registrar assinatura, receber no PWA (Android e iOS 16.4+)
- [ ] 🟡 WhatsApp (API oficial) para lembretes
- [ ] 🟢 Preferências de notificação por usuário

### 10. Fechamento do MVP
- [ ] 🔴 Fluxo completo ponta a ponta (criar → inscrever → pagar → painel), testado no **desktop e no celular**
- [ ] 🔴 PWA instalável e utilizável offline no essencial (shell + telas já visitadas)
- [ ] 🔴 Conformidade LGPD mínima (consentimento, política de privacidade, exclusão de dados)
- [ ] 🟡 Testes com 3–5 organizadores reais (igreja, escola, família)
- [ ] 🟡 Landing de captação · 🟢 Onboarding guiado

---

## ⭐ Fase 2 — Plano Pro

> Para organizadores frequentes. Assinatura e automações.

- [ ] 🔴 Assinaturas e cobrança recorrente (planos Free/Pro) + limites por plano
- [ ] 🔴 Viagens ilimitadas no Pro
- [ ] 🔴 📱 **Check-in via QR Code** no dia da viagem: leitura de câmera (BarcodeDetector/Capacitor) + lista digital
- [ ] 🟡 Relatórios avançados (financeiro, participantes, custos)
- [ ] 🟡 **Duplicar viagem** (eventos recorrentes)
- [ ] 🟡 Automações de cobrança e comunicação · 🟡 IA operacional ampliada
- [ ] 🟢 Confirmação de presença e comunicação em tempo real
- [ ] 🟢 Pós-viagem: avaliações e galeria de fotos

---

## 🏢 Fase 3 — Plano Business

> Para escolas, igrejas e empresas. Times e governança.

- [ ] 🔴 Organizações multi-tenant (`org_id`) + papéis/permissões (Django Groups)
- [ ] 🟡 Múltiplos administradores por viagem
- [ ] 🟡 Relatórios avançados e exportação (CSV/PDF)
- [ ] 🟡 Integrações (contabilidade, calendários, planilhas)
- [ ] 🟢 Autorização digital e assinatura eletrônica (menores de idade)
- [ ] 🟢 Marca personalizada (white-label leve) por organização

---

## 🌐 Fase 4 — Visão de Longo Prazo

- [ ] 🟢 **Apps nas lojas** (iOS/Android) empacotando o PWA via **Capacitor** — mesma base de código
- [ ] 🟢 Intermediação financeira via gateway (split de pagamento)
- [ ] 🟢 Marketplace de hotéis e de fretamento · fornecedores parceiros
- [ ] 🟢 Recomendação automática de fornecedores · seguro viagem · contratos
- [ ] 🟢 IA integrada a APIs reais (hotéis, restaurantes, clima, distâncias)
- [ ] 🟢 Dashboards inteligentes e previsões financeiras

---

## 🔁 Transversal (durante todo o projeto)

- [ ] 🔴 Segurança: hashing (nativo Django), rate limiting, validação, HTTPS, CSRF/CORS
- [ ] 🔴 Tokens no PWA de forma segura (preferir cookie httpOnly a localStorage p/ dados sensíveis)
- [ ] 🔴 LGPD: base legal, consentimento, minimização e retenção de dados
- [ ] 🟡 Acessibilidade (WCAG) e desempenho no celular (Lighthouse/PWA score)
- [ ] 🟡 Cobertura de testes das regras críticas (rateio, pagamentos)
- [ ] 🟡 Backups automáticos do banco e plano de recuperação
- [ ] 🟢 Internacionalização (i18n) — começar em pt-BR
- [ ] 🟢 Documentação viva (atualizar `docs/` a cada decisão relevante)
