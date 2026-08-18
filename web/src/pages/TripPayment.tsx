import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'

import { PublicLayout } from '../components/Layout'
import { Copy } from '../components/icons'
import { Alert, Button, Card, CardBody, Loading } from '../components/ui'
import { type TripPaymentInfo, getTripPayment } from '../lib/api/pix'

export default function TripPayment() {
  const { slug } = useParams<{ slug: string }>()
  const [info, setInfo] = useState<TripPaymentInfo | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [copiado, setCopiado] = useState(false)

  useEffect(() => {
    getTripPayment(slug)
      .then(setInfo)
      .catch(() => setInfo(null))
      .finally(() => setCarregando(false))
  }, [slug])

  async function copiar() {
    if (!info?.pix_payload) return
    await navigator.clipboard.writeText(info.pix_payload)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2500)
  }

  if (carregando) {
    return (
      <PublicLayout>
        <Loading />
      </PublicLayout>
    )
  }

  if (!info) {
    return (
      <PublicLayout>
        <Card>
          <CardBody className="py-12 text-center">
            <h1 className="text-xl font-semibold">Viagem não encontrada</h1>
          </CardBody>
        </Card>
      </PublicLayout>
    )
  }

  if (!info.has_pix_account) {
    return (
      <PublicLayout>
        <Card>
          <CardBody className="space-y-4 py-10 text-center">
            <h1 className="text-xl font-semibold">Pagamento ainda não disponível</h1>
            <p className="text-ink-muted">
              Quem organiza ainda não cadastrou a conta para recebimento. Entre em
              contato para combinar o pagamento.
            </p>
          </CardBody>
        </Card>
      </PublicLayout>
    )
  }

  return (
    <PublicLayout>
      <Card>
        <CardBody className="space-y-6">
          <div className="text-center">
            <h1 className="text-xl font-semibold">Pagar com PIX</h1>
            <p className="mt-1 text-ink-muted">{info.trip}</p>
          </div>

          {info.qr_code && (
            <div className="flex justify-center">
              <div className="rounded-card border border-line bg-white p-4">
                <img
                  src={info.qr_code}
                  alt="QR Code para pagamento PIX"
                  className="h-56 w-56"
                />
              </div>
            </div>
          )}

          <div className="divide-y divide-line rounded-lg border border-line">
            {info.pix_owner_name && (
              <div className="flex justify-between gap-4 px-4 py-3 text-[15px]">
                <span className="text-ink-muted">Favorecido</span>
                <span className="text-right font-medium">{info.pix_owner_name}</span>
              </div>
            )}
            {info.pix_bank && (
              <div className="flex justify-between gap-4 px-4 py-3 text-[15px]">
                <span className="text-ink-muted">Instituição</span>
                <span className="text-right font-medium">{info.pix_bank}</span>
              </div>
            )}
            {info.pix_key && (
              <div className="flex justify-between gap-4 px-4 py-3 text-[15px]">
                <span className="shrink-0 text-ink-muted">Chave PIX</span>
                <span className="min-w-0 break-all text-right font-medium">
                  {info.pix_key}
                </span>
              </div>
            )}
          </div>

          {info.pix_payload && (
            <Button variant="secondary" block size="lg" onClick={copiar}>
              <Copy className="h-4 w-4" />
              {copiado ? 'Código copiado!' : 'Copiar código PIX'}
            </Button>
          )}

          <Alert tone="brand" title="Depois de pagar">
            Envie o comprovante para quem organiza a viagem, para que o pagamento seja
            registrado.
          </Alert>
        </CardBody>
      </Card>
    </PublicLayout>
  )
}
