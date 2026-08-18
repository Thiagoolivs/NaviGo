# 🗺️ Telas e Fluxos — NaviGo

Mapa das telas e dos fluxos do sistema, para os dois atores principais:
**organizador** (quem cria e gere a viagem) e **participante** (quem se inscreve
e paga). Marca a fase de cada tela (🟢 MVP · ⭐ Pro · 🏢 Business).

> Estado atual (Fase 1): **Login**, **Cadastro**, **Painel**, **Criar viagem
> (assistente)**, **Detalhe da viagem**, **Página pública**, **Inscrição do
> participante** e **Gestão (participantes e pagamentos)** implementadas.

---

## 1. Atores e áreas

- **Organizador** — área autenticada (painel): cria a viagem, define orçamento,
  acompanha inscrições e pagamentos, usa a IA e o checklist.
- **Participante** — área pública (por link/QR): vê a viagem, se inscreve e paga.
  Não precisa de conta no MVP.

---

## 2. Mapa de navegação

```mermaid
flowchart TD
    subgraph Publico[Area publica]
        LP[Landing]
        LOG[Login]
        REG[Cadastro]
        FORGOT[Recuperar senha]
        TRIP[Pagina publica da viagem]
        SUB[Inscricao]
        PAY[Pagamento PIX]
        MYS[Meu status / meus pagamentos]
    end

    subgraph App[Area do organizador - autenticada]
        DASH[Painel]
        NEW[Criar viagem - assistente]
        BUDGET[Orcamento]
        PARTS[Participantes]
        PAYS[Pagamentos e inadimplencia]
        TASKS[Checklist e tarefas]
        DOCS[Documentos]
        CFG[Config da viagem]
        REPORT[Relatorios / pos-viagem]
        CHECKIN[Check-in QR no dia]
    end

    LP --> LOG --> DASH
    LP --> REG --> DASH
    LOG --> FORGOT
    DASH --> NEW --> BUDGET --> PARTS
    DASH --> TRIP
    NEW --> TASKS
    DASH --> PAYS
    DASH --> TASKS
    DASH --> DOCS
    DASH --> CFG
    DASH --> REPORT
    DASH --> CHECKIN

    TRIP --> SUB --> PAY --> MYS
```

---

## 3. Fluxos principais

### 3.1 Autenticação

```mermaid
flowchart LR
    A[Login/Cadastro] -->|e-mail + senha| B[API dj-rest-auth]
    A -->|Google| G[OAuth Google]
    B --> C[Cookie JWT httpOnly]
    G --> C
    C --> D[Painel]
```

E-mails (verificação, recuperação de senha) saem pelo `EMAIL_BACKEND` — console
em dev, **Resend** em produção.

### 3.2 Organizador (do planejamento ao pós-viagem)

```mermaid
flowchart LR
    N[Criar viagem] --> IA[Assistente IA<br/>perguntas guiadas]
    IA --> O[Orcamento<br/>valor por pessoa]
    O --> P[Publicar + gerar link/QR]
    P --> Q[Acompanhar inscricoes<br/>e pagamentos]
    Q --> R[Dia da viagem<br/>check-in QR]
    R --> S[Pos-viagem<br/>relatorios / duplicar]
```

### 3.3 Participante (inscrição e pagamento)

```mermaid
flowchart LR
    L[Abre link/QR] --> V[Ve a viagem]
    V --> I[Preenche inscricao]
    I --> C[Recebe cobranca PIX]
    C --> Pg[Paga - QR / copia e cola]
    Pg --> B[Baixa automatica - webhook]
    B --> St[Status: pago]
```

---

## 4. Telas em detalhe

### 4.1 Autenticação
| Tela | Fase | Conteúdo |
|------|------|----------|
| **Login** | 🟢 | E-mail + senha, "Entrar com Google", link p/ cadastro e recuperação |
| **Cadastro** | 🟢 | E-mail + senha (username gerado); já autentica ao concluir |
| **Recuperar senha** | 🟢 | Pede e-mail → envia link (endpoint pronto) |
| **Perfil** | 🟡 | Nome, telefone, foto, **chave PIX** do organizador |

### 4.2 Organizador
| Tela | Fase | Conteúdo |
|------|------|----------|
| **Painel** | 🟢 | Viagens, vagas, arrecadado vs. meta, inadimplentes, tarefas |
| **Criar viagem (assistente)** | 🟢 | Wizard: dados básicos → perguntas da IA → estrutura montada |
| **Orçamento** | 🟢 | Itens por categoria; **valor por participante** em tempo real |
| **Participantes** | 🟢 | Lista + status (inscrito/confirmado/cancelado), detalhe, cadastro manual |
| **Pagamentos** | 🟢 | Parcelas, quem pagou/deve, lembretes, conciliação |
| **Checklist & tarefas** | 🟢 | Tarefas (geradas pela IA ou manuais), marcar concluídas |
| **Documentos** | 🟡 | Arquivos da viagem (contratos, listas) |
| **Config da viagem** | 🟢 | Editar dados, limite de vagas, publicar/encerrar |
| **Relatórios / pós-viagem** | ⭐ | Financeiro, participantes, avaliações; **duplicar viagem** |
| **Check-in (dia da viagem)** | ⭐ | Leitura de **QR** por câmera + lista digital |

### 4.2.b Gestão da viagem (a "planilha", porém melhor)

Substitui a planilha do organizador: uma linha por participante, com filtros e
busca, mostrando de uma vez **pagamento** e **documentos entregues**.

| Bloco | Conteúdo |
|-------|----------|
| **Resumo** | Inscritos · pagos · a pagar · atrasados · falta documento · menores · recebido / a receber / esperado |
| **Filtros** | Todos · Pagos · Parciais · A pagar · Atrasados · Falta documento · Menores |
| **Linha do participante** | Situação do pagamento, quanto pagou de quanto, nº de parcelas, e o que falta entregar |
| **Detalhe (expandir)** | Contato, responsável (se menor), embarque, camiseta, restrição alimentar, observações médicas |
| **Documentos** | Marcar entregue/não entregue (autorização, ficha médica, RG...) |
| **Parcelas** | Marcar paga/não paga e **re-parcelar** (mais ou menos parcelas), preservando o já pago |

### 4.3 Participante (público)
| Tela | Fase | Conteúdo |
|------|------|----------|
| **Página da viagem** | 🟢 | Destino, datas, vagas, botão de inscrição |
| **Inscrição** | 🟢 | Dados pessoais, menor + responsável, saúde (restrição, medicamentos, plano), camiseta, embarque, **escolha do parcelamento** e aceite LGPD |
| **Pagamento PIX** | 🟢 | QR Code + copia e cola; status atualiza após a baixa |
| **Meu status** | 🟢 | Situação da inscrição e das parcelas |

### 4.4 Organização (Business)
| Tela | Fase | Conteúdo |
|------|------|----------|
| **Equipe & permissões** | 🏢 | Vários administradores, papéis (admin/financeiro/…) |
| **Relatórios da organização** | 🏢 | Consolidado de várias viagens, exportação |

---

## 5. Mapa telas → rotas (PWA)

| Rota | Tela | Existe? |
|------|------|---------|
| `/login` | Login | ✅ |
| `/register` | Cadastro | ✅ |
| `/` | Painel (lista de viagens) | ✅ |
| `/trip/:slug` | Página pública da viagem | ✅ |
| `/trips/new` | Criar viagem (assistente) | ✅ |
| `/trips/:id` | Detalhe: checklist + orçamento | ✅ |
| `/trip/:slug/subscribe` | Inscrição do participante | ✅ |
| `/trips/:id/roster` | Gestão: participantes e pagamentos | ✅ |
| `/trip/:slug/pay` | Pagamento PIX (participante) | ⬜ Fase 1 |

> As rotas de `/trips/:id/*` são a área autenticada do organizador; `/trip/:slug`
> (singular) é a área pública do participante.
