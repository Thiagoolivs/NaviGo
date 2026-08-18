import { type FormEvent, useState } from 'react'
import { Link, useHistory } from 'react-router-dom'

import { Logo } from '../components/Layout'
import { Alert, Button, Card, Field, Input } from '../components/ui'
import { ApiError, login } from '../lib/api/auth'

export default function Login() {
  const history = useHistory()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  async function entrar(e: FormEvent) {
    e.preventDefault()
    setErro(null)
    setEnviando(true)
    try {
      await login(email, senha)
      history.replace('/app')
    } catch (err) {
      setErro(
        err instanceof ApiError
          ? 'E-mail ou senha incorretos.'
          : 'Não foi possível entrar. Tente novamente.',
      )
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-canvas px-4 py-10">
      <Link to="/" className="mb-7">
        <Logo />
      </Link>

      <Card className="w-full max-w-sm p-7">
        <h1 className="text-xl font-semibold">Entrar</h1>
        <p className="mt-1 text-sm text-ink-muted">Acesse o painel das suas viagens.</p>

        <form onSubmit={entrar} className="mt-6 space-y-4">
          {erro && <Alert>{erro}</Alert>}

          <Field label="E-mail">
            <Input
              type="email"
              autoComplete="email"
              placeholder="voce@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </Field>

          <Field label="Senha">
            <Input
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
            />
          </Field>

          <Button type="submit" block size="lg" loading={enviando}>
            {enviando ? 'Entrando…' : 'Entrar'}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-ink-muted">
          Não tem conta?{' '}
          <Link to="/register" className="font-medium text-brand-600 hover:underline">
            Criar conta grátis
          </Link>
        </p>
      </Card>
    </div>
  )
}
