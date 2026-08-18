import { useCallback, useEffect, useState } from 'react'
import { Link, useHistory } from 'react-router-dom'

import { AppLayout, PageHeader } from '../components/Layout'
import { Calendar, MapPin, Plus, Users } from '../components/icons'
import {
  Badge,
  Card,
  EmptyState,
  LinkButton,
  Loading,
} from '../components/ui'
import { cn, formatDate } from '../lib/format'
import { getCurrentUser, logout } from '../lib/api/auth'
import { TRIP_TYPES, type Trip, listTrips } from '../lib/api/trips'

export default function Dashboard() {
  const history = useHistory()
  const [trips, setTrips] = useState<Trip[]>([])
  const [carregando, setCarregando] = useState(true)

  const carregar = useCallback(async () => {
    const user = await getCurrentUser()
    if (!user) {
      history.replace('/login')
      return
    }
    try {
      setTrips(await listTrips())
    } finally {
      setCarregando(false)
    }
  }, [history])

  useEffect(() => {
    void carregar()
  }, [carregar])

  async function sair() {
    await logout().catch(() => undefined)
    history.replace('/')
  }

  const rotulo = (t: Trip) => TRIP_TYPES.find((o) => o.value === t.type)?.label ?? t.type

  return (
    <AppLayout onLogout={sair}>
      <PageHeader
        title="Minhas viagens"
        subtitle={
          trips.length > 0
            ? 'Acompanhe inscrições, pagamentos e pendências.'
            : undefined
        }
        actions={
          trips.length > 0 ? (
            <LinkButton to="/app/viagens/nova">
              <Plus className="h-4 w-4" /> Nova viagem
            </LinkButton>
          ) : undefined
        }
      />

      {carregando ? (
        <Loading />
      ) : trips.length === 0 ? (
        <EmptyState
          icon={<MapPin />}
          title="Comece pela sua primeira viagem"
          description="Responda algumas perguntas e o assistente monta a estrutura, o checklist e o valor por participante para você."
          action={
            <LinkButton to="/app/viagens/nova" size="lg">
              <Plus className="h-4 w-4" /> Criar minha primeira viagem
            </LinkButton>
          }
        />
      ) : (
        <div className="space-y-3">
          {trips.map((trip) => {
            const publicada = trip.status === 'published'
            return (
              <Link key={trip.id} to={`/app/viagens/${trip.id}`} className="block">
                <Card className="p-5 transition hover:border-line-strong hover:shadow-float">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h2 className="truncate text-[17px] font-semibold">{trip.name}</h2>
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-muted">
                        <span className="inline-flex items-center gap-1.5">
                          <MapPin className="h-4 w-4" />
                          {trip.destination}
                        </span>
                        {trip.start_date && (
                          <span className="inline-flex items-center gap-1.5">
                            <Calendar className="h-4 w-4" />
                            {formatDate(trip.start_date)}
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1.5">
                          <Users className="h-4 w-4" />
                          {trip.participants_count}
                          {trip.capacity ? ` / ${trip.capacity}` : ''} inscritos
                        </span>
                      </div>
                    </div>

                    <Badge tone={publicada ? 'success' : 'neutral'}>
                      {publicada ? 'Publicada' : 'Rascunho'}
                    </Badge>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line pt-4 text-sm">
                    <Badge tone="brand">{rotulo(trip)}</Badge>
                    {trip.tasks_pending > 0 && (
                      <span className={cn('text-ink-muted')}>
                        {trip.tasks_pending} tarefa(s) pendente(s)
                      </span>
                    )}
                    {!publicada && (
                      <span className="ml-auto font-medium text-brand-600">
                        Continuar preparando →
                      </span>
                    )}
                  </div>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </AppLayout>
  )
}
