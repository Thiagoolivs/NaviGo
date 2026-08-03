# ✅ Checklist de Desenvolvimento — NaviGo

Checklist acionável para tirar o NaviGo do papel. Organizado por fases; cada
item é uma tarefa concreta. Marque `[x]` conforme concluir.

> **Legenda de prioridade:** 🔴 crítico para o MVP · 🟡 importante · 🟢 desejável
> **Relação com o roadmap estratégico:** ver [`docs/ROADMAP.md`](./docs/ROADMAP.md).

- [ ] **Fase 0** — Fundação do projeto
- [ ] **Fase 1** — MVP
- [ ] **Fase 2** — Plano Pro
- [ ] **Fase 3** — Plano Business
- [ ] **Fase 4** — Visão de longo prazo

---

## 🧱 Fase 0 — Fundação do Projeto

### Decisões e alinhamento
- [ ] 🔴 Validar/ajustar a stack proposta em [`docs/ARQUITETURA.md`](./docs/ARQUITETURA.md)
- [ ] 🔴 Escolher o PSP de PIX (Mercado Pago, Asaas ou Pagar.me) e criar conta sandbox
- [ ] 🔴 Escolher o provedor de IA (Claude/OpenAI) e obter chave de API
- [ ] 🟡 Definir nome de domínio e identidade visual básica (logo, cores, tipografia)
- [ ] 🟡 Escolher a licença do projeto

### Setup do repositório
- [ ] 🔴 Inicializar o projeto Next.js + TypeScript
- [ ] 🔴 Configurar Tailwind CSS + shadcn/ui
- [ ] 🔴 Configurar ESLint + Prettier + `.editorconfig`
- [ ] 🔴 Adicionar `.gitignore`, `.env.example` e `.nvmrc`
- [ ] 🟡 Configurar Husky + lint-staged (checagens no pre-commit)
- [ ] 🟡 Definir convenção de commits (Conventional Commits) e template de PR
- [ ] 🟢 Configurar Storybook para componentes de UI

### Banco de dados e infra
- [ ] 🔴 Provisionar PostgreSQL (Supabase/Neon/Railway) — ambientes dev e prod
- [ ] 🔴 Configurar Prisma e traduzir o [modelo de dados](./docs/MODELO-DE-DADOS.md) em `schema.prisma`
- [ ] 🔴 Rodar a primeira migração e o seed inicial
- [ ] 🟡 Configurar variáveis de ambiente por ambiente (dev/staging/prod)
- [ ] 🟡 Configurar CI (GitHub Actions): lint, typecheck, testes, build
- [ ] 🟢 Configurar deploy automático (Vercel) por branch/preview

### Qualidade e observabilidade (base)
- [ ] 🟡 Configurar framework de testes (Vitest/Jest + Testing Library)
- [ ] 🟡 Configurar testes end-to-end (Playwright)
- [ ] 🟢 Configurar monitoramento de erros (Sentry) e analytics de produto

---

## 🚀 Fase 1 — MVP

> Escopo mínimo para uma viagem real ser organizada de ponta a ponta.
> "Sem excesso de funcionalidades."

### 1. Autenticação e conta
- [ ] 🔴 Cadastro e login do organizador (e-mail/senha ou magic link)
- [ ] 🔴 Login social (Google) — reduz atrito
- [ ] 🔴 Recuperação de senha
- [ ] 🟡 Perfil do organizador (nome, telefone, foto, dados PIX)
- [ ] 🟡 Verificação de e-mail

### 2. Criar viagem
- [ ] 🔴 Formulário de criação: nome, destino, data(s), duração, nº de participantes, tipo
- [ ] 🔴 Tipos de viagem pré-definidos (igreja, escola, família, amigos, corporativa, evento)
- [ ] 🔴 Página de detalhe/edição da viagem
- [ ] 🟡 Upload de imagem de capa da viagem
- [ ] 🟢 Rascunho vs. publicada (status da viagem)

### 3. Assistente Inteligente (IA)
- [ ] 🔴 Fluxo de perguntas guiadas (hospedagem? alimentação? transporte fretado? quartos? grupos? limite de vagas?)
- [ ] 🔴 Montar a estrutura da viagem automaticamente a partir das respostas
- [ ] 🔴 Gerar **checklist automático** de tarefas com base no tipo de viagem
- [ ] 🟡 Sugerir itens de orçamento com base nas respostas
- [ ] 🟡 Guardrails/limites de custo e tratamento de erros da API de IA
- [ ] 🟢 Sugerir cronograma/roteiro inicial

### 4. Orçamento e precificação
- [ ] 🔴 Cadastro de itens de custo por categoria (transporte, hospedagem, alimentação, ingressos, extras)
- [ ] 🔴 Cálculo automático do **valor por participante**
- [ ] 🔴 Configuração de margem de segurança e exibição do custo total
- [ ] 🟡 Custos fixos vs. custos por pessoa
- [ ] 🟢 Simulação de cenários (ex.: variação por nº de participantes)

### 5. Página pública e convites
- [ ] 🔴 Página pública da viagem (informações + botão de inscrição)
- [ ] 🔴 Link de inscrição único (slug) por viagem
- [ ] 🔴 Geração de **QR Code** do convite
- [ ] 🔴 Formulário de inscrição do participante (dados + termos)
- [ ] 🟡 Controle de limite de vagas (fecha inscrições ao lotar)
- [ ] 🟢 Lista de espera quando esgotar

### 6. Participantes
- [ ] 🔴 Cadastro/listagem de participantes por viagem
- [ ] 🔴 Status do participante (inscrito, confirmado, cancelado)
- [ ] 🟡 Cadastro manual de participante pelo organizador
- [ ] 🟡 Campos personalizados (documento, contato de emergência, restrições)
- [ ] 🟢 Divisão em quartos/grupos

### 7. Pagamentos via PIX
- [ ] 🔴 Integração com o PSP escolhido (sandbox → produção)
- [ ] 🔴 Geração de **QR Code PIX** por participante/parcela
- [ ] 🔴 Confirmação automática via webhook e **baixa do pagamento**
- [ ] 🔴 Controle de parcelas (valor, vencimento, status)
- [ ] 🔴 Painel de inadimplência (quem pagou, quem deve)
- [ ] 🟡 **Lembretes automáticos** de cobrança
- [ ] 🟡 Conciliação e tratamento de estorno/falha
- [ ] 🟢 Comprovante/recibo de pagamento

### 8. Painel do organizador
- [ ] 🔴 Visão geral: participantes, vagas restantes, arrecadado vs. meta
- [ ] 🔴 Lista de pagamentos e inadimplentes
- [ ] 🔴 Checklist e tarefas pendentes
- [ ] 🟡 Repositório de documentos da viagem
- [ ] 🟢 Indicadores/gráficos financeiros básicos

### 9. Notificações
- [ ] 🔴 E-mail transacional (confirmação de inscrição, pagamento, lembretes)
- [ ] 🟡 Notificações via WhatsApp (API oficial)
- [ ] 🟢 Preferências de notificação por usuário

### 10. Fechamento do MVP
- [ ] 🔴 Fluxo completo testado ponta a ponta (criar → inscrever → pagar → painel)
- [ ] 🔴 Conformidade LGPD mínima (consentimento, política de privacidade, exclusão de dados)
- [ ] 🟡 Testes com 3–5 organizadores reais (igreja, escola, família)
- [ ] 🟡 Página de landing/marketing para captação
- [ ] 🟢 Onboarding guiado para o primeiro uso

---

## ⭐ Fase 2 — Plano Pro

> Para organizadores frequentes. Assinatura e automações.

- [ ] 🔴 Assinaturas e cobrança recorrente (planos Free/Pro)
- [ ] 🔴 Limites por plano (Free: 1 viagem/limite de participantes)
- [ ] 🔴 Viagens ilimitadas no Pro
- [ ] 🔴 **Check-in via QR Code** no dia da viagem + lista digital
- [ ] 🟡 Relatórios avançados (financeiro, participantes, custos)
- [ ] 🟡 **Duplicar viagem** (eventos recorrentes)
- [ ] 🟡 Automações de cobrança e comunicação
- [ ] 🟡 IA operacional ampliada (cronogramas, previsão de despesas, alertas)
- [ ] 🟢 Confirmação de presença e comunicação em tempo real
- [ ] 🟢 Pós-viagem: avaliações e galeria de fotos

---

## 🏢 Fase 3 — Plano Business

> Para escolas, igrejas e empresas. Times e governança.

- [ ] 🔴 Organizações/contas com múltiplos usuários (multi-tenant)
- [ ] 🔴 Papéis e permissões (admin, organizador, financeiro, visualizador)
- [ ] 🟡 Múltiplos administradores por viagem
- [ ] 🟡 Relatórios avançados e exportação (CSV/PDF)
- [ ] 🟡 Integrações (contabilidade, calendários, planilhas)
- [ ] 🟢 Autorização digital e assinatura eletrônica de termos (menores de idade)
- [ ] 🟢 Marca personalizada (white-label leve) por organização

---

## 🌐 Fase 4 — Visão de Longo Prazo

- [ ] 🟢 Aplicativo móvel (iOS/Android)
- [ ] 🟢 Intermediação financeira via gateway (split de pagamento)
- [ ] 🟢 Marketplace de hotéis e de fretamento
- [ ] 🟢 Fornecedores parceiros e recomendação automática
- [ ] 🟢 Seguro viagem e emissão de contratos
- [ ] 🟢 IA integrada a APIs reais (hotéis, restaurantes, clima, distâncias)
- [ ] 🟢 Dashboards inteligentes e previsões financeiras

---

## 🔁 Transversal (durante todo o projeto)

- [ ] 🔴 Segurança: hashing de senhas, rate limiting, validação de entrada, HTTPS
- [ ] 🔴 LGPD: base legal, consentimento, minimização e retenção de dados
- [ ] 🟡 Acessibilidade (WCAG) e responsividade mobile-first
- [ ] 🟡 Cobertura de testes das regras críticas (cálculo de rateio, pagamentos)
- [ ] 🟡 Backups automáticos do banco e plano de recuperação
- [ ] 🟢 Internacionalização (i18n) — começar em pt-BR
- [ ] 🟢 Documentação viva (atualizar `docs/` a cada decisão relevante)
