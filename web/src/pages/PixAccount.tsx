import { type ChangeEvent, useCallback, useEffect, useState } from 'react'
import { useHistory } from 'react-router-dom'

import { AppLayout, PageHeader } from '../components/Layout'
import { QrCode } from '../components/icons'
import {
  Alert,
  Button,
  Card,
  CardBody,
  CardHeader,
  Field,
  Input,
  Loading,
  Select,
  Textarea,
} from '../components/ui'
import { cn } from '../lib/format'
import { ApiError } from '../lib/api/client'
import {
  PIX_KEY_TYPES,
  type PixAccount as PixAccountData,
  type PixKeyType,
  getPixAccount,
  savePixAccount,
} from '../lib/api/pix'

const MAX_BYTES = 512 * 1024

export default function PixAccount() {
  const history = useHistory()
  const [conta, setConta] = useState<PixAccountData | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [salvo, setSalvo] = useState(false)

  const [modo, setModo] = useState<'codigo' | 'imagem'>('codigo')
  const [favorecido, setFavorecido] = useState('')
  const [banco, setBanco] = useState('')
  const [chave, setChave] = useState('')
  const [tipoChave, setTipoChave] = useState<PixKeyType>('')
  const [payload, setPayload] = useState('')
  const [imagem, setImagem] = useState('')

  const carregar = useCallback(async () => {
    try {
      const c = await getPixAccount()
      setConta(c)
      setFavorecido(c.pix_owner_name)
      setBanco(c.pix_bank)
      setChave(c.pix_key)
      setTipoChave(c.pix_key_type)
      setPayload(c.pix_payload)
      setImagem(c.pix_qr_image)
      if (!c.pix_payload && c.pix_qr_image) setModo('imagem')
    } catch (e) {
      if (e instanceof ApiError && (e.status === 401 || e.status === 403)) {
        history.replace('/login')
        return
      }
      setErro('Não foi possível carregar a conta.')
    } finally {
      setCarregando(false)
    }
  }, [history])

  useEffect(() => {
    void carregar()
  }, [carregar])

  function selecionarArquivo(e: ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0]
    if (!arquivo) return
    if (arquivo.size > MAX_BYTES) {
      setErro('A imagem deve ter no máximo 512 KB.')
      return
    }
    const leitor = new FileReader()
    leitor.onload = () => {
      setImagem(String(leitor.result))
      setErro(null)
    }
    leitor.readAsDataURL(arquivo)
  }

  async function salvar() {
    setErro(null)
    setSalvo(false)
    setSalvando(true)
    try {
      setConta(
        await savePixAccount({
          pix_owner_name: favorecido,
          pix_bank: banco,
          pix_key: chave,
          pix_key_type: tipoChave,
          // Guarda só o modo escolhido, para não exibir um QR antigo por engano.
          pix_payload: modo === 'codigo' ? payload : '',
          pix_qr_image: modo === 'imagem' ? imagem : '',
        }),
      )
      setSalvo(true)
    } catch (e) {
      setErro(e instanceof ApiError ? e.firstMessage : 'Não foi possível salvar.')
    } finally {
      setSalvando(false)
    }
  }

  if (carregando) {
    return (
      <AppLayout>
        <Loading />
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <PageHeader
        title="Conta para recebimento"
        subtitle="Cadastre seu PIX para que os participantes paguem direto para você."
        backTo="/app"
      />

      <div className="space-y-5">
        {erro && <Alert>{erro}</Alert>}
        {salvo && <Alert tone="success">Conta salva com sucesso.</Alert>}

        {conta?.qr_code && (
          <Card>
            <CardBody className="flex flex-col items-center py-7">
              <div className="rounded-card border border-line p-4">
                <img src={conta.qr_code} alt="QR Code PIX cadastrado" className="h-48 w-48" />
              </div>
              <p className="mt-3 text-sm text-ink-muted">
                É este QR Code que o participante vê ao pagar.
              </p>
            </CardBody>
          </Card>
        )}

        <Card>
          <CardHeader title="Dados do favorecido" />
          <CardBody className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nome do favorecido" hint="Como aparece na sua conta bancária.">
                <Input
                  placeholder="Ex.: Igreja Batista Central"
                  value={favorecido}
                  onChange={(e) => setFavorecido(e.target.value)}
                />
              </Field>
              <Field label="Instituição">
                <Input
                  placeholder="Banco ou carteira digital"
                  value={banco}
                  onChange={(e) => setBanco(e.target.value)}
                />
              </Field>
              <Field label="Tipo da chave">
                <Select
                  value={tipoChave}
                  onChange={(e) => setTipoChave(e.target.value as PixKeyType)}
                >
                  <option value="">Selecione</option>
                  {PIX_KEY_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Chave PIX">
                <Input value={chave} onChange={(e) => setChave(e.target.value)} />
              </Field>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="QR Code"
            subtitle="Escolha como quer cadastrar o QR que os participantes vão usar."
          />
          <CardBody className="space-y-4">
            <div className="inline-flex rounded-lg border border-line bg-canvas p-1">
              {(
                [
                  ['codigo', 'Colar código'],
                  ['imagem', 'Enviar imagem'],
                ] as const
              ).map(([v, label]) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setModo(v)}
                  className={cn(
                    'rounded-md px-4 py-2 text-sm font-medium transition',
                    modo === v ? 'bg-white text-ink shadow-sm' : 'text-ink-muted',
                  )}
                >
                  {label}
                </button>
              ))}
            </div>

            {modo === 'codigo' ? (
              <Field
                label="Código PIX copia e cola"
                hint="Geramos o QR Code a partir do código — é a opção mais confiável."
              >
                <Textarea
                  rows={4}
                  placeholder="Cole aqui o código gerado no app do seu banco"
                  value={payload}
                  onChange={(e) => setPayload(e.target.value)}
                />
              </Field>
            ) : (
              <Field label="Imagem do QR Code" hint="PNG ou JPEG, até 512 KB.">
                <input
                  type="file"
                  accept="image/png,image/jpeg"
                  onChange={selecionarArquivo}
                  className="block w-full text-sm text-ink-soft file:mr-3 file:rounded-lg
                             file:border-0 file:bg-brand-50 file:px-4 file:py-2
                             file:text-sm file:font-medium file:text-brand-700
                             hover:file:bg-brand-100"
                />
                {imagem && (
                  <img
                    src={imagem}
                    alt="Pré-visualização do QR Code"
                    className="mt-4 h-40 w-40 rounded-lg border border-line"
                  />
                )}
              </Field>
            )}
          </CardBody>
        </Card>

        <Button size="lg" block loading={salvando} onClick={salvar}>
          <QrCode className="h-4 w-4" /> Salvar conta de recebimento
        </Button>
      </div>
    </AppLayout>
  )
}
