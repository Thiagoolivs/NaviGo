# 🎯 Especificação do Produto — NaviGo

Este documento traduz o [relatório de concepção](./CONCEPCAO.md) em uma
especificação de produto acionável: para quem construímos, o valor que
entregamos, a jornada do usuário e como cobramos por isso.

---

## 1. Visão do produto

> Permitir que **qualquer pessoa** organize uma viagem em grupo inteira, mesmo
> sem experiência, respondendo perguntas simples enquanto a plataforma conduz o
> resto.

O NaviGo é um **copiloto inteligente**: acompanha o organizador do planejamento
à conclusão, reduzindo retrabalho, centralizando pagamentos e automatizando
tarefas. Não vendemos software — vendemos **tranquilidade**.

---

## 2. O problema

Viagens em grupo hoje são organizadas com ferramentas desconexas:

| Ferramenta atual | Dor gerada |
|------------------|-----------|
| WhatsApp | Excesso de mensagens, informação perdida |
| Planilhas Excel | Erros de cálculo, retrabalho, difícil de compartilhar |
| PIX manual | Cobranças esquecidas, sem baixa automática |
| Papel / ligações | Nada centralizado, difícil para novos organizadores |

**Consequência:** controle de pagamentos ruim, cobranças esquecidas, perda de
informação, retrabalho e estresse. O NaviGo centraliza tudo em um só lugar.

---

## 3. Personas

### 🙏 Rogério — Líder de igreja
Organiza retiros e excursões 2–4× por ano. Usa WhatsApp e uma planilha. Perde
tempo cobrando quem não pagou e nunca sabe ao certo o caixa. **Quer:** cobrança
automática e uma lista clara de quem confirmou.

### 🎒 Professora Aline — Coordenadora escolar
Organiza a excursão anual da escola. Processo 100% manual, com autorizações em
papel dos responsáveis. **Quer:** inscrição online, controle de pagamentos e
autorizações digitais.

### 👨‍👩‍👧 Marcelo — Pai de família
Organiza a viagem anual da família grande (20+ pessoas). Só usa grupo de
WhatsApp. **Quer:** dividir custos de forma justa e cobrar todo mundo sem
constrangimento.

### 🧑‍🤝‍🧑 Bruno — Organizador de amigos
Junta a galera para shows e eventos. **Quer:** um link para todos se
inscreverem e pagarem sozinhos, sem ele virar "banco".

> **Foco do MVP:** organizadores **sem experiência profissional** (igrejas,
> escolas, famílias, amigos). Agências e operadoras profissionais são público
> **futuro**.

---

## 4. Proposta de valor

- **Simplicidade extrema** — responde perguntas, a plataforma faz o resto.
- **IA em toda a jornada** — do planejamento ao pós-viagem.
- **Cobrança automática** — PIX com QR Code, baixa automática e lembretes.
- **Painel centralizado** — tudo em um lugar, fim das planilhas.
- **Checklists inteligentes** — nada é esquecido.
- **Duplicação de viagens** — ideal para eventos recorrentes.
- **Especialização** — pensado para igrejas, escolas e famílias.

---

## 5. Jornada do organizador (detalhada)

### Etapa 1 — Criar viagem
Entrada: nome, destino, data(s), duração, nº de participantes, tipo de viagem.
Saída: viagem criada em rascunho.

### Etapa 2 — Assistente inteligente
A IA pergunta: *haverá hospedagem? alimentação? transporte fretado? quartos?
divisão em grupos? limite de vagas?* Conforme as respostas, monta a estrutura
da viagem e gera um checklist de tarefas.

### Etapa 3 — Orçamento
Cadastro de custos (transporte, hospedagem, alimentação, ingressos, extras). O
sistema calcula **valor por participante**, **margem de segurança** e **custo
total**. Diferencia custos fixos (rateados) de custos por pessoa.

### Etapa 4 — Pagamentos
PIX direto ao organizador (MVP): geração de QR Code, confirmação automática por
webhook, baixa do pagamento, lembretes automáticos e controle de parcelas.
*Futuro:* intermediação financeira com split via gateway.

### Etapa 5 — Convites
O sistema gera link, página pública da viagem e QR Code. O participante acessa,
vê as informações e faz a inscrição.

### Etapa 6 — Painel do organizador
Participantes, vagas restantes, pagamentos, inadimplentes, checklist,
documentos e tarefas pendentes.

### Etapa 7 — Dia da viagem
Check-in via QR Code, lista digital, confirmação de presença e comunicação em
tempo real. *(Pro)*

### Etapa 8 — Pós-viagem
Relatórios (financeiro, participantes, custos, fotos, avaliações) e opção de
**duplicar a viagem** para eventos recorrentes.

---

## 6. O papel da IA

A IA **não é um chatbot** — é um **assistente operacional**:

| Já no MVP | Evolução |
|-----------|----------|
| Perguntas guiadas para montar a viagem | Comparar opções e prever despesas |
| Gerar checklist por tipo de viagem | Sugerir roteiro e cronograma |
| Sugerir itens de orçamento | Alertar problemas e riscos |
| — | Integrar APIs reais (hotéis, clima, distâncias, transporte) |

---

## 7. Diferenciais competitivos

Concorrentes citados — **WeTravel, SquadTrip, Trawfy, TravelJoy** — atendem
principalmente **agentes e organizadores profissionais**. O NaviGo se
diferencia ao focar o **público não especializado**, com experiência guiada,
IA em toda a jornada e especialização em excursões de igreja, escolas e
famílias.

---

## 8. Modelo de receita

| Plano | Público | Inclui |
|-------|---------|--------|
| **Gratuito** | Quem está experimentando | 1 viagem, nº limitado de participantes, funcionalidades básicas |
| **Pro** | Organizadores frequentes | Viagens ilimitadas, automações, relatórios, IA, QR Check-in |
| **Business** | Escolas, igrejas, empresas | Múltiplos admins, permissões, equipe, relatórios avançados, integrações |

> Início com **assinatura**. Intermediação financeira (taxa sobre pagamentos) é
> uma alavanca de receita para o **futuro**.

---

## 9. Métricas de sucesso (norte)

- **Ativação:** % de organizadores que criam a 1ª viagem e recebem o 1º pagamento.
- **Conclusão:** % de viagens que chegam ao "dia da viagem" pela plataforma.
- **Eficiência de cobrança:** % de pagamentos em dia sem intervenção manual.
- **Recorrência:** organizadores que criam uma 2ª viagem (ou duplicam).
- **Conversão Free → Pro.**

---

## 10. Fora de escopo do MVP

Para manter o MVP enxuto ("sem excesso de funcionalidades"), **ficam para
depois**: marketplace, seguro viagem, contratos, app móvel, intermediação
financeira, integrações externas e IA conectada a APIs reais. Ver
[`ROADMAP.md`](./ROADMAP.md).
