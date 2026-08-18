import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonCheckbox,
  IonChip,
  IonContent,
  IonHeader,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
  IonNote,
  IonPage,
  IonSegment,
  IonSegmentButton,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonText,
  IonTitle,
  IonToolbar,
} from '@ionic/react'
import { useCallback, useState } from 'react'
import { useParams } from 'react-router'
import { useIonViewWillEnter } from '@ionic/react'

import { ApiError } from '../lib/api/client'
import {
  BUDGET_CATEGORIES,
  type BudgetCategory,
  type BudgetItem,
  type CostType,
  type Pricing,
  type Task,
  type Trip,
  createBudgetItem,
  deleteBudgetItem,
  getPricing,
  getTrip,
  listBudgetItems,
  listTasks,
  publishTrip,
  runAssistant,
  toggleTask,
} from '../lib/api/trips'

const brl = (valor: string | number) =>
  Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export default function TripDetail() {
  const { id } = useParams<{ id: string }>()
  const tripId = Number(id)

  const [aba, setAba] = useState<'checklist' | 'orcamento'>('checklist')
  const [trip, setTrip] = useState<Trip | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [itens, setItens] = useState<BudgetItem[]>([])
  const [pricing, setPricing] = useState<Pricing | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  // novo item de orçamento
  const [categoria, setCategoria] = useState<BudgetCategory>('transport')
  const [valor, setValor] = useState('')
  const [descricao, setDescricao] = useState('')
  const [tipoCusto, setTipoCusto] = useState<CostType>('fixed')

  const carregar = useCallback(async () => {
    try {
      const [t, tk, bi, pr] = await Promise.all([
        getTrip(tripId),
        listTasks(tripId),
        listBudgetItems(tripId),
        getPricing(tripId),
      ])
      setTrip(t)
      setTasks(tk)
      setItens(bi)
      setPricing(pr)
    } catch (e) {
      setErro(e instanceof ApiError ? e.firstMessage : 'Não foi possível carregar a viagem.')
    } finally {
      setCarregando(false)
    }
  }, [tripId])

  useIonViewWillEnter(() => {
    void carregar()
  })

  async function alternarTarefa(task: Task) {
    const atualizada = await toggleTask(task)
    setTasks((lista) => lista.map((t) => (t.id === task.id ? atualizada : t)))
  }

  async function adicionarItem() {
    if (!valor) return
    const criado = await createBudgetItem({
      trip: tripId,
      category: categoria,
      description: descricao,
      amount: valor,
      cost_type: tipoCusto,
    })
    setItens((lista) => [...lista, criado])
    setValor('')
    setDescricao('')
    setPricing(await getPricing(tripId))
  }

  async function removerItem(itemId: number) {
    await deleteBudgetItem(itemId)
    setItens((lista) => lista.filter((i) => i.id !== itemId))
    setPricing(await getPricing(tripId))
  }

  async function gerarChecklist() {
    setErro(null)
    try {
      await runAssistant(tripId)
      setTasks(await listTasks(tripId))
    } catch (e) {
      setErro(
        e instanceof ApiError && e.status === 503
          ? 'Assistente indisponível — configure GEMINI_API_KEY na API.'
          : 'Não consegui gerar o checklist agora.',
      )
    }
  }

  async function publicar() {
    setTrip(await publishTrip(tripId))
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonButtons slot="start">
            <IonBackButton defaultHref="/" />
          </IonButtons>
          <IonTitle>{trip?.name ?? 'Viagem'}</IonTitle>
        </IonToolbar>
        <IonToolbar>
          <IonSegment value={aba} onIonChange={(e) => setAba(e.detail.value as typeof aba)}>
            <IonSegmentButton value="checklist">
              <IonLabel>Checklist</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="orcamento">
              <IonLabel>Orçamento</IonLabel>
            </IonSegmentButton>
          </IonSegment>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        {erro && (
          <IonText color="warning">
            <p>{erro}</p>
          </IonText>
        )}

        {carregando ? (
          <div className="ion-text-center">
            <IonSpinner />
          </div>
        ) : (
          <>
            {trip && (
              <IonCard>
                <IonCardHeader>
                  <IonCardSubtitle>{trip.destination}</IonCardSubtitle>
                  <IonCardTitle>{brl(pricing?.price_per_participant ?? 0)} por pessoa</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <IonChip color={trip.status === 'published' ? 'success' : 'medium'}>
                    {trip.status === 'published' ? 'Publicada' : 'Rascunho'}
                  </IonChip>
                  <IonChip>{pricing?.participants ?? 0} participantes</IonChip>
                  {pricing && Number(pricing.safety_margin_percent) > 0 && (
                    <IonChip>margem {Number(pricing.safety_margin_percent)}%</IonChip>
                  )}
                  {trip.status !== 'published' && (
                    <IonButton expand="block" className="ion-margin-top" onClick={publicar}>
                      Publicar e gerar link
                    </IonButton>
                  )}
                  {trip.status === 'published' && (
                    <IonNote>Link público: /trip/{trip.slug}</IonNote>
                  )}
                  <IonButton
                    expand="block"
                    fill="outline"
                    className="ion-margin-top"
                    routerLink={`/trips/${tripId}/roster`}
                  >
                    Participantes e pagamentos
                  </IonButton>
                </IonCardContent>
              </IonCard>
            )}

            {aba === 'checklist' && (
              <>
                <IonList inset>
                  <IonListHeader>
                    <IonLabel>Tarefas</IonLabel>
                  </IonListHeader>
                  {tasks.length === 0 && (
                    <IonItem lines="none">
                      <IonLabel className="ion-text-wrap">
                        <IonNote>Nenhuma tarefa ainda.</IonNote>
                      </IonLabel>
                    </IonItem>
                  )}
                  {tasks.map((task) => (
                    <IonItem key={task.id}>
                      <IonCheckbox
                        checked={task.done}
                        onIonChange={() => alternarTarefa(task)}
                        labelPlacement="end"
                        justify="start"
                      >
                        <span className={task.done ? 'ion-text-wrap done' : 'ion-text-wrap'}>
                          {task.title}
                        </span>
                      </IonCheckbox>
                      {task.source === 'ai' && (
                        <IonNote slot="end">IA</IonNote>
                      )}
                    </IonItem>
                  ))}
                </IonList>
                <IonButton expand="block" fill="outline" onClick={gerarChecklist}>
                  Gerar checklist com o assistente
                </IonButton>
              </>
            )}

            {aba === 'orcamento' && (
              <>
                <IonList inset>
                  <IonListHeader>
                    <IonLabel>Custos</IonLabel>
                  </IonListHeader>
                  {itens.map((item) => (
                    <IonItem key={item.id}>
                      <IonLabel className="ion-text-wrap">
                        <h3>
                          {BUDGET_CATEGORIES.find((c) => c.value === item.category)?.label}
                        </h3>
                        <p>
                          {item.description || '—'} ·{' '}
                          {item.cost_type === 'fixed' ? 'fixo (rateado)' : 'por pessoa'}
                        </p>
                      </IonLabel>
                      <IonNote slot="end">{brl(item.amount)}</IonNote>
                      <IonButton
                        slot="end"
                        fill="clear"
                        color="danger"
                        onClick={() => removerItem(item.id)}
                      >
                        Remover
                      </IonButton>
                    </IonItem>
                  ))}
                </IonList>

                <IonList inset>
                  <IonListHeader>
                    <IonLabel>Adicionar custo</IonLabel>
                  </IonListHeader>
                  <IonItem>
                    <IonSelect
                      label="Categoria"
                      value={categoria}
                      onIonChange={(e) => setCategoria(e.detail.value)}
                    >
                      {BUDGET_CATEGORIES.map((c) => (
                        <IonSelectOption key={c.value} value={c.value}>
                          {c.label}
                        </IonSelectOption>
                      ))}
                    </IonSelect>
                  </IonItem>
                  <IonItem>
                    <IonSelect
                      label="Tipo"
                      value={tipoCusto}
                      onIonChange={(e) => setTipoCusto(e.detail.value)}
                    >
                      <IonSelectOption value="fixed">Fixo (rateado)</IonSelectOption>
                      <IonSelectOption value="per_person">Por pessoa</IonSelectOption>
                    </IonSelect>
                  </IonItem>
                  <IonItem>
                    <IonInput
                      label="Descrição"
                      labelPlacement="floating"
                      value={descricao}
                      onIonInput={(e) => setDescricao(e.detail.value ?? '')}
                    />
                  </IonItem>
                  <IonItem>
                    <IonInput
                      type="number"
                      label="Valor (R$)"
                      labelPlacement="floating"
                      value={valor}
                      onIonInput={(e) => setValor(e.detail.value ?? '')}
                    />
                  </IonItem>
                </IonList>
                <IonButton expand="block" onClick={adicionarItem} disabled={!valor}>
                  Adicionar
                </IonButton>

                {pricing && (
                  <IonList inset>
                    <IonItem>
                      <IonLabel>Custos fixos</IonLabel>
                      <IonNote slot="end">{brl(pricing.total_fixed)}</IonNote>
                    </IonItem>
                    <IonItem>
                      <IonLabel>Custos por pessoa</IonLabel>
                      <IonNote slot="end">{brl(pricing.total_per_person)}</IonNote>
                    </IonItem>
                    <IonItem>
                      <IonLabel>
                        <strong>Valor por participante</strong>
                      </IonLabel>
                      <IonNote slot="end" color="primary">
                        <strong>{brl(pricing.price_per_participant)}</strong>
                      </IonNote>
                    </IonItem>
                    <IonItem lines="none">
                      <IonLabel>Total estimado</IonLabel>
                      <IonNote slot="end">{brl(pricing.estimated_total)}</IonNote>
                    </IonItem>
                  </IonList>
                )}
              </>
            )}
          </>
        )}
      </IonContent>
    </IonPage>
  )
}
