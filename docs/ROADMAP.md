# 🗺️ Roadmap Estratégico — NaviGo

Visão de fases do produto. Enquanto o [`CHECKLIST.md`](../CHECKLIST.md) é
**tático** (tarefas com caixinhas), este roadmap é **estratégico** (objetivos,
escopo, critérios de saída e métricas por fase).

```
Fase 0 ──▶ Fase 1 ──▶ Fase 2 ──▶ Fase 3 ──▶ Fase 4
Fundação    MVP         Pro         Business    Ecossistema
```

---

## Fase 0 — Fundação

**Objetivo:** preparar o terreno técnico e as decisões de produto para começar
a construir com segurança.

- **Escopo:** setup do repositório, stack definida, PSP e IA escolhidos, banco
  provisionado, CI/CD e modelo de dados traduzido em schema.
- **Critério de saída:** ambiente de dev roda localmente, migração inicial
  aplicada, pipeline de CI verde.
- **Métrica:** "hello world" da aplicação no ar em ambiente de preview.

---

## Fase 1 — MVP

**Objetivo:** permitir que um organizador real conduza **uma viagem inteira de
ponta a ponta** pela plataforma. Entregue como **PWA** — roda no navegador
(desktop/notebook) e instala no celular como app, com uma base de código única.

- **Escopo (o que entra):**
  - Criação de viagem + assistente de IA (perguntas guiadas)
  - Orçamento com cálculo de valor por participante
  - Página pública + link/QR de inscrição
  - Cadastro de participantes
  - Pagamentos via PIX (QR, baixa automática, parcelas, inadimplência)
  - Painel do organizador
  - Notificações (e-mail; WhatsApp se possível)
  - Checklist automático
  - LGPD mínima
- **O que NÃO entra:** assinaturas pagas, multi-tenant, marketplace, app móvel,
  intermediação financeira.
- **Critério de saída:** ≥ 3 viagens reais organizadas de ponta a ponta por
  organizadores externos (igreja, escola, família), com pagamentos recebidos
  pela plataforma.
- **Métricas-norte:** ativação (1ª viagem + 1º pagamento) e eficiência de
  cobrança (pagamentos em dia sem intervenção manual).
- **Risco principal:** integração de PIX/webhooks e confiança do organizador em
  receber o dinheiro. **Mitigação:** PIX direto ao organizador (sem custódia) no
  MVP.

---

## Fase 2 — Plano Pro

**Objetivo:** transformar organizadores frequentes em **assinantes pagantes**.

- **Escopo:** assinaturas (Free/Pro), limites por plano, viagens ilimitadas,
  QR Check-in no dia da viagem, relatórios, duplicar viagem, automações e IA
  operacional ampliada.
- **Critério de saída:** primeira receita recorrente e conversão Free → Pro
  mensurável.
- **Métrica:** taxa de conversão Free → Pro e retenção mensal.

---

## Fase 3 — Plano Business

**Objetivo:** atender **escolas, igrejas e empresas** com times e governança.

- **Escopo:** contas de organização (multi-tenant), papéis e permissões,
  múltiplos administradores, relatórios avançados/exportação, integrações e
  autorização/assinatura digital para menores.
- **Critério de saída:** primeiras contas Business ativas com mais de um usuário.
- **Métrica:** nº de organizações ativas e receita por conta.

---

## Fase 4 — Visão de Longo Prazo

**Objetivo:** evoluir para um **ecossistema completo** de viagens em grupo.

- **Escopo:** apps nas lojas (iOS/Android) empacotando o PWA via **Capacitor**,
  intermediação financeira (split), marketplace de hotéis e fretamento,
  fornecedores parceiros, seguro viagem, contratos, IA conectada a APIs reais e
  dashboards preditivos.
- **Critério de saída:** parceiros/fornecedores transacionando na plataforma.

---

## Sequência recomendada e princípio norteador

1. **Valide antes de escalar.** Não avance de fase sem bater o critério de saída
   da anterior.
2. **MVP enxuto.** Resista a adicionar funcionalidades fora do escopo da Fase 1.
3. **Feedback dos primeiros clientes** (igrejas, escolas, famílias) dirige a
   priorização das fases seguintes.

---

## Riscos transversais

| Risco | Mitigação |
|-------|-----------|
| Confiança em pagamentos | PIX direto ao organizador no MVP; custódia só depois |
| Conformidade LGPD | Base legal e privacidade desde a Fase 1 |
| Custo/latência de IA | Guardrails, cache e limites de uso |
| Dependência de PSP | Abstrair o gateway atrás de uma interface própria |
| Complexidade prematura | Manter o MVP enxuto; multi-tenant só na Fase 3 |
