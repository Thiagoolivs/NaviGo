import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { PublicLayout } from '../components/Layout'
import { Calendar, Check, MapPin, Users } from '../components/icons'
import {
  Badge,
  Card,
  CardBody,
  LinkButton,
  Loading,
} from '../components/ui'
import { formatDate } from '../lib/format'
import { api } from '../lib/api/client'
import { TRIP_TYPES, type TripType } from '../lib/api/trips'

interface PublicTripData {
  name: string
  destination: string
  type: TripType
  start_date: string | null
  end_date: string | null
  duration_days: number | null
  capacity: number | null
  slug: string
  cover_image_url: string
  spots_left: number | null
}

export default function PublicTrip() {
  const { slug } = useParams<{ slug: string }>()
  const [trip, setTrip] = useState<PublicTripData | null>(null)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    api
      .get<PublicTripData>(`/public/trips/${slug}/`)
      .then(setTrip)
      .catch(() => setTrip(null))
      .finally(() => setCarregando(false))
  }, [slug])

  if (carregando) {
    return (
      <PublicLayout>
        <Loading />
      </PublicLayout>
    )
  }

  if (!trip) {
    return (
      <PublicLayout>
        <Card>
          <CardBody className="py-12 text-center">
            <h1 className="text-xl font-semibold">Viagem não encontrada</h1>
            <p className="mt-2 text-ink-muted">
              O link pode estar incorreto ou a viagem ainda não foi publicada. Confirme
              com quem organiza.
            </p>
          </CardBody>
        </Card>
      </PublicLayout>
    )
  }

  const tipo = TRIP_TYPES.find((t) => t.value === trip.type)?.label
  const esgotado = trip.spots_left === 0

  return (
    <PublicLayout>
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-br from-brand-600 to-brand-700 px-6 py-9 text-white">
          {tipo && (
            <span className="inline-flex rounded-full bg-white/15 px-2.5 py-0.5 text-xs font-medium">
              {tipo}
            </span>
          )}
          <h1 className="mt-3 text-2xl font-semibold sm:text-3xl">{trip.name}</h1>
          <p className="mt-2 inline-flex items-center gap-1.5 text-brand-50">
            <MapPin className="h-4 w-4" />
            {trip.destination}
          </p>
        </div>

        <CardBody className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-2">
            {trip.start_date && (
              <div className="flex items-center gap-3 rounded-lg border border-line bg-canvas px-4 py-3">
                <Calendar className="h-5 w-5 shrink-0 text-brand-600" />
                <div>
                  <div className="text-xs text-ink-muted">Saída</div>
                  <div className="font-medium">{formatDate(trip.start_date)}</div>
                </div>
              </div>
            )}
            {trip.duration_days && (
              <div className="flex items-center gap-3 rounded-lg border border-line bg-canvas px-4 py-3">
                <Check className="h-5 w-5 shrink-0 text-brand-600" />
                <div>
                  <div className="text-xs text-ink-muted">Duração</div>
                  <div className="font-medium">{trip.duration_days} dia(s)</div>
                </div>
              </div>
            )}
            {trip.spots_left !== null && (
              <div className="flex items-center gap-3 rounded-lg border border-line bg-canvas px-4 py-3">
                <Users className="h-5 w-5 shrink-0 text-brand-600" />
                <div>
                  <div className="text-xs text-ink-muted">Vagas</div>
                  <div className="font-medium">
                    {esgotado ? 'Esgotadas' : `${trip.spots_left} restante(s)`}
                  </div>
                </div>
              </div>
            )}
          </div>

          {esgotado ? (
            <Badge tone="danger">As vagas para esta viagem acabaram</Badge>
          ) : (
            <LinkButton to={`/trip/${slug}/inscricao`} size="lg" block>
              Quero me inscrever
            </LinkButton>
          )}

          <p className="text-center text-sm text-ink-muted">
            Já se inscreveu?{' '}
            <Link
              to={`/trip/${slug}/pagamento`}
              className="font-medium text-brand-600 hover:underline"
            >
              Ver como pagar
            </Link>
          </p>
        </CardBody>
      </Card>
    </PublicLayout>
  )
}
