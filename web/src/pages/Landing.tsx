import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { Logo } from '../components/Layout'
import { Check, Doc, QrCode, Sparkles, Users, Wallet } from '../components/icons'
import { Card, LinkButton, Spinner } from '../components/ui'
import { getCurrentUser } from '../lib/api/auth'

const COMO_FUNCIONA = [
  {
    icon: <Sparkles />,
    titulo: 'Responda algumas perguntas',
    texto:
      'Diga o destino, as datas e o tipo da viagem. O assistente monta a estrutura e o checklist do que você precisa fazer.',
  },
  {
    icon: <Wallet />,
    titulo: 'Lance os custos',
    texto:
      'Ônibus, hospedagem, alimentação. O valor por pessoa é calculado na hora, com margem de segurança se você quiser.',
  },
  {
    icon: <Users />,
    titulo: 'Compartilhe o link',
    texto:
      'Cada participante se inscreve sozinho, informa os dados e escolhe em quantas vezes quer pagar.',
  },
  {
    icon: <Doc />,
    titulo: 'Acompanhe tudo num lugar',
    texto:
      'Quem pagou, quem está devendo, quem entregou a autorização. Sem planilha e sem caçar mensagem no WhatsApp.',
  },
]

const PARA_QUEM = [
  { titulo: 'Igrejas', texto: 'Retiros, congressos e caravanas — com ficha de inscrição e autorização de menores.' },
  { titulo: 'Escolas', texto: 'Excursões com autorização dos responsáveis, ficha médica e controle de documentos.' },
  { titulo: 'Famílias e amigos', texto: 'Divida os custos de forma justa e cobre todo mundo sem constrangimento.' },
]

const DORES = [
  'Planilha que ninguém entende',
  'Cobrança esquecida no WhatsApp',
  'Autorização de menor que sumiu',
  'Não saber quanto já entrou',
]

export default function Landing() {
  const [checando, setChecando] = useState(true)
  const [logado, setLogado] = useState(false)

  useEffect(() => {
    getCurrentUser()
      .then((u) => setLogado(Boolean(u)))
      .finally(() => setChecando(false))
  }, [])

  return (
    <div className="min-h-dvh bg-white">
      {/* Cabeçalho */}
      <header className="sticky top-0 z-30 border-b border-line bg-white/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Logo />
          <div className="flex items-center gap-2">
            {checando ? (
              <Spinner className="h-5 w-5 text-ink-muted" />
            ) : logado ? (
              <LinkButton to="/app" size="sm">
                Ir para o painel
              </LinkButton>
            ) : (
              <>
                <LinkButton to="/login" variant="ghost" size="sm">
                  Entrar
                </LinkButton>
                <LinkButton to="/register" size="sm">
                  Criar conta grátis
                </LinkButton>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Herói */}
      <section className="relative overflow-hidden border-b border-line bg-gradient-to-b from-brand-50/70 to-white">
        <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:py-24">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-white px-3 py-1 text-xs font-medium text-brand-700">
            <Sparkles className="h-3.5 w-3.5" />
            Com assistente inteligente
          </span>

          <h1 className="mt-5 text-3xl font-semibold leading-tight tracking-tight sm:text-5xl">
            Organize a viagem do grupo{' '}
            <span className="text-brand-600">sem virar o banco de ninguém</span>
          </h1>

          <p className="mx-auto mt-5 max-w-xl text-lg text-ink-soft">
            Do primeiro orçamento ao último pagamento: inscrição por link, controle de
            parcelas e documentos em um painel só. Feito para quem organiza retiros,
            excursões escolares e viagens em família.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <LinkButton to="/register" size="lg">
              Criar minha primeira viagem
            </LinkButton>
            <LinkButton to="/login" variant="secondary" size="lg">
              Já tenho conta
            </LinkButton>
          </div>

          <p className="mt-4 text-sm text-ink-muted">
            Grátis para começar · Não precisa cartão de crédito
          </p>
        </div>
      </section>

      {/* Problema */}
      <section className="mx-auto max-w-4xl px-4 py-14">
        <div className="rounded-card border border-line bg-canvas p-6 sm:p-8">
          <h2 className="text-xl font-semibold">Hoje isso vive espalhado</h2>
          <p className="mt-1.5 text-ink-muted">
            WhatsApp, planilha, papel e PIX solto. O NaviGo junta tudo.
          </p>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2">
            {DORES.map((d) => (
              <li key={d} className="flex items-center gap-2.5 text-[15px] text-ink-soft">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
                  ✕
                </span>
                {d}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Como funciona */}
      <section className="mx-auto max-w-5xl px-4 pb-16">
        <div className="mb-9 text-center">
          <h2 className="text-2xl font-semibold sm:text-3xl">Como funciona</h2>
          <p className="mt-2 text-ink-muted">Quatro passos, do começo ao fim.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {COMO_FUNCIONA.map((p, i) => (
            <Card key={p.titulo} className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                  {p.icon}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-brand-600">PASSO {i + 1}</div>
                  <h3 className="mt-0.5 text-[17px] font-semibold">{p.titulo}</h3>
                  <p className="mt-1.5 text-[15px] leading-relaxed text-ink-soft">{p.texto}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Para quem */}
      <section className="border-y border-line bg-canvas">
        <div className="mx-auto max-w-5xl px-4 py-14">
          <h2 className="text-center text-2xl font-semibold sm:text-3xl">Feito para o seu grupo</h2>
          <div className="mt-9 grid gap-4 sm:grid-cols-3">
            {PARA_QUEM.map((p) => (
              <div key={p.titulo} className="rounded-card border border-line bg-white p-6">
                <h3 className="text-[17px] font-semibold">{p.titulo}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-ink-soft">{p.texto}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Destaques */}
      <section className="mx-auto max-w-5xl px-4 py-16">
        <div className="grid gap-6 sm:grid-cols-3">
          {[
            { icon: <Wallet />, t: 'Cobrança organizada', d: 'Parcelas, quem pagou e quem está atrasado — sempre visível.' },
            { icon: <QrCode />, t: 'PIX com QR Code', d: 'Cadastre sua conta e o participante paga direto para você.' },
            { icon: <Check />, t: 'Documentos em dia', d: 'Autorização de menores e fichas: saiba na hora quem falta entregar.' },
          ].map((f) => (
            <div key={f.t}>
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-white">
                {f.icon}
              </div>
              <h3 className="font-semibold">{f.t}</h3>
              <p className="mt-1.5 text-[15px] leading-relaxed text-ink-soft">{f.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Chamada final */}
      <section className="border-t border-line bg-brand-600">
        <div className="mx-auto max-w-3xl px-4 py-16 text-center">
          <h2 className="text-2xl font-semibold text-white sm:text-3xl">
            A próxima viagem pode ser bem mais tranquila
          </h2>
          <p className="mt-3 text-brand-50">
            Crie sua conta e monte a primeira viagem em poucos minutos.
          </p>
          <div className="mt-7 flex justify-center">
            <Link
              to="/register"
              className="inline-flex h-12 items-center justify-center rounded-lg bg-white px-6 font-medium text-brand-700 transition hover:bg-brand-50"
            >
              Começar agora
            </Link>
          </div>
        </div>
      </section>

      <footer className="mx-auto max-w-6xl px-4 py-10 text-center text-sm text-ink-muted">
        <Logo className="justify-center text-ink" />
        <p className="mt-3">Organize viagens em grupo sem planilha.</p>
      </footer>
    </div>
  )
}
