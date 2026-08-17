# 🧭 NaviGo

> **O copiloto inteligente para organizar viagens em grupo.**
> Da primeira ideia ao pós-viagem — sem planilhas, sem caos no WhatsApp, sem
> cobranças esquecidas.

[![Status](https://img.shields.io/badge/status-concep%C3%A7%C3%A3o-blue)](./docs/ROADMAP.md)
[![Fase](https://img.shields.io/badge/fase-MVP%20(planejamento)-orange)](./CHECKLIST.md)
[![Licença](https://img.shields.io/badge/licen%C3%A7a-a%20definir-lightgrey)](#licença)

---

## O que é o NaviGo

NaviGo é uma plataforma SaaS que permite que **qualquer pessoa** — mesmo sem
experiência — organize uma viagem em grupo do início ao fim. O organizador
responde a perguntas simples e um assistente inteligente monta a estrutura da
viagem, calcula o valor por participante, gera a página de inscrição, controla
os pagamentos via PIX e acompanha tudo em um painel único.

Funciona como **web app (PWA)**: roda no navegador em desktop/notebook e
**instala no celular como aplicativo** — tudo a partir de uma base de código só.

**A proposta não é vender software. É vender tranquilidade.**

### Para quem é

Líderes de igreja, professores e coordenadores escolares, famílias, grupos de
amigos, organizadores independentes e pequenas empresas — o público que hoje se
vira com WhatsApp, planilhas e PIX manual.

---

## O problema

Hoje, viagens em grupo são organizadas com uma colcha de retalhos de WhatsApp,
Excel, papel, PIX manual e ligações. O resultado é retrabalho, cobranças
esquecidas, informação perdida e muito estresse. **O NaviGo centraliza tudo
isso em um só lugar.**

---

## A jornada em 8 etapas

| # | Etapa | O que acontece |
|---|-------|----------------|
| 1 | **Criar viagem** | Nome, destino, datas, tipo e nº de participantes |
| 2 | **Assistente IA** | Perguntas simples montam a estrutura da viagem |
| 3 | **Orçamento** | Custos entram, o sistema calcula o valor por pessoa |
| 4 | **Pagamentos** | PIX com QR Code, baixa automática e lembretes |
| 5 | **Convites** | Link + página da viagem + QR Code de inscrição |
| 6 | **Painel** | Participantes, vagas, inadimplentes, checklist, tarefas |
| 7 | **Dia da viagem** | Check-in por QR Code e confirmação de presença |
| 8 | **Pós-viagem** | Relatórios, avaliações e "duplicar viagem" |

---

## Documentação

Este repositório está em **fase de concepção**. A base do projeto está
documentada aqui:

| Documento | Conteúdo |
|-----------|----------|
| 📋 [`CHECKLIST.md`](./CHECKLIST.md) | **Checklist de desenvolvimento** por fases (comece por aqui) |
| 🗺️ [`docs/ROADMAP.md`](./docs/ROADMAP.md) | Roadmap estratégico: MVP → Pro → Business → longo prazo |
| 🖼️ [`docs/TELAS-E-FLUXOS.md`](./docs/TELAS-E-FLUXOS.md) | Telas e fluxos do sistema (organizador e participante) |
| 🎯 [`docs/PRODUTO.md`](./docs/PRODUTO.md) | Especificação do produto: personas, valor, jornada, planos |
| 🏛️ [`docs/ARQUITETURA.md`](./docs/ARQUITETURA.md) | Stack recomendada, arquitetura, integrações (PIX/IA), LGPD |
| 🗄️ [`docs/MODELO-DE-DADOS.md`](./docs/MODELO-DE-DADOS.md) | Entidades, relacionamentos e diagrama ER |
| 📄 [`docs/CONCEPCAO.md`](./docs/CONCEPCAO.md) | Relatório de concepção original (fonte) |

---

## Stack recomendada (resumo)

> Proposta inicial — pode ser ajustada. Detalhes e alternativas em
> [`docs/ARQUITETURA.md`](./docs/ARQUITETURA.md).

- **Frontend (PWA):** Ionic + React + TypeScript (Vite) — web + instalável no celular
- **PWA:** service worker (vite-plugin-pwa), Web Push, pronto para Capacitor (app nativo futuro)
- **Backend / API:** Python — Django + DRF (alternativa: FastAPI)
- **Banco de dados:** PostgreSQL · **Jobs:** Celery + Redis
- **Auth:** dj-rest-auth + django-allauth
- **Pagamentos PIX:** PSP brasileiro (Mercado Pago / Asaas / Pagar.me)
- **IA:** SDK de LLM (Anthropic Claude / OpenAI)
- **Notificações:** E-mail (Resend) + WhatsApp + Web Push
- **Deploy:** API (Railway / Render / Fly) + PWA estático (Vercel / Netlify / CDN)

---

## Status do projeto

🟢 **Fase 0 — Fundação em andamento.** O monorepo já tem o esqueleto do backend
(Django + DRF) e do frontend (PWA Ionic + React), com PSP de PIX e provedor de
IA atrás de interfaces (stubs). Próximo: **Fase 1 (MVP)** do
[`CHECKLIST.md`](./CHECKLIST.md).

## Estrutura do monorepo

```
NaviGo/
├── api/                # Backend Python (Django + DRF)
├── web/                # Frontend PWA (Ionic + React + Vite)
├── docs/               # Documentação do projeto
├── docker-compose.yml  # PostgreSQL + Redis (dev)
└── CHECKLIST.md        # Checklist de desenvolvimento
```

## Como rodar (desenvolvimento)

```bash
# 1) Infraestrutura (opcional — sem isso, a API usa SQLite)
docker compose up -d

# 2) Backend (API)  — requer uv (https://docs.astral.sh/uv/)
cd api && uv sync
uv run python manage.py migrate
uv run python manage.py runserver      # http://localhost:8000

# 3) Frontend (PWA) — em outro terminal
cd web && npm install
npm run dev                            # http://localhost:5173
```

Teste rápido da API: `GET http://localhost:8000/api/v1/health/`.

---

## Licença

A definir. Sugestão: privado até validação do MVP; reavaliar licenciamento na
Fase Pro/Business.
