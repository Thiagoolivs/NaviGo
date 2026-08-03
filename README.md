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
| 🎯 [`docs/PRODUTO.md`](./docs/PRODUTO.md) | Especificação do produto: personas, valor, jornada, planos |
| 🏛️ [`docs/ARQUITETURA.md`](./docs/ARQUITETURA.md) | Stack recomendada, arquitetura, integrações (PIX/IA), LGPD |
| 🗄️ [`docs/MODELO-DE-DADOS.md`](./docs/MODELO-DE-DADOS.md) | Entidades, relacionamentos e diagrama ER |
| 📄 [`docs/CONCEPCAO.md`](./docs/CONCEPCAO.md) | Relatório de concepção original (fonte) |

---

## Stack recomendada (resumo)

> Proposta inicial — pode ser ajustada. Detalhes e alternativas em
> [`docs/ARQUITETURA.md`](./docs/ARQUITETURA.md).

- **Full-stack:** Next.js (App Router) + TypeScript
- **UI:** Tailwind CSS + shadcn/ui
- **Banco de dados:** PostgreSQL + Prisma
- **Auth / Storage:** Supabase (ou Auth.js + S3)
- **Pagamentos PIX:** PSP brasileiro (Mercado Pago / Asaas / Pagar.me)
- **IA:** API de LLM (Anthropic Claude / OpenAI)
- **Notificações:** E-mail (Resend) + WhatsApp (API oficial)
- **Deploy:** Vercel + banco gerenciado (Supabase / Neon / Railway)

---

## Status do projeto

🟠 **Concepção / Planejamento.** Ainda não há código de aplicação. O próximo
passo é executar a **Fase 0** e a **Fase 1 (MVP)** do
[`CHECKLIST.md`](./CHECKLIST.md).

### Como contribuir agora

1. Leia o [`CHECKLIST.md`](./CHECKLIST.md) e o [`docs/ROADMAP.md`](./docs/ROADMAP.md).
2. Valide/ajuste a stack em [`docs/ARQUITETURA.md`](./docs/ARQUITETURA.md).
3. Revise o [modelo de dados](./docs/MODELO-DE-DADOS.md) antes de iniciar o código.

---

## Licença

A definir. Sugestão: privado até validação do MVP; reavaliar licenciamento na
Fase Pro/Business.
