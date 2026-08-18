import { type FormEvent, useState } from 'react'
import { Link, useHistory } from 'react-router-dom'

import { Logo } from '../components/Layout'
import { Alert, Button, Card, Field, Input } from '../components/ui'
import { ApiError, register } from '../lib/api/auth'

const MIN_SENHA = 8

export default function Register() {
  const history = useHistory()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  const senhaCurta = senha.length > 0 && senha.length < MIN_SENHA

  async function cadastrar(e: FormEvent) {
    e.preventDefault()
    setErro(null)
    setEnviando(true)
    try {
      // register() cadastra e já autentica (o login é quem define o cookie).
      await register(email, senha)
      history.replace('/app')
    } catch (err) {
      setErro(
        err instanceof ApiError ? err.firstMessage : 'Não foi possível criar a conta.',
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
        <h1 className="text-xl font-semibold">Criar conta</h1>
        <p className="mt-1 text-sm text-ink-muted">
          É grátis. Em poucos minutos sua viagem está montada.
        </p>

        <form onSubmit={cadastrar} className="mt-6 space-y-4">
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

          <Field
            label="Senha"
            hint={`Pelo menos ${MIN_SENHA} caracteres.`}
            error={senhaCurta ? `A senha precisa de ao menos ${MIN_SENHA} caracteres.` : undefined}
          >
            <Input
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              invalid={senhaCurta}
              required
            />
          </Field>

          <Button type="submit" block size="lg" loading={enviando} disabled={senhaCurta}>
            {enviando ? 'Criando…' : 'Criar conta'}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-ink-muted">
          Já tem conta?{' '}
          <Link to="/login" className="font-medium text-brand-600 hover:underline">
            Entrar
          </Link>
        </p>
      </Card>
    </div>
  )
}
