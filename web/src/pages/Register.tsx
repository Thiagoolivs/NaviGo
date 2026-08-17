import {
  IonButton,
  IonContent,
  IonHeader,
  IonInput,
  IonItem,
  IonList,
  IonNote,
  IonPage,
  IonText,
  IonTitle,
  IonToolbar,
  useIonRouter,
} from '@ionic/react'
import { type FormEvent, useState } from 'react'
import { Link } from 'react-router-dom'

import { AuthError, register } from '../lib/api/auth'

export default function Register() {
  const router = useIonRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await register(email, password)
      // O cadastro já autentica (cookie JWT). Vai para o painel.
      router.push('/', 'root', 'replace')
    } catch (err) {
      if (err instanceof AuthError) {
        const first = Object.values(err.detail)[0]
        setError(Array.isArray(first) ? String(first[0]) : 'Verifique os dados.')
      } else {
        setError('Erro ao cadastrar.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>Criar conta</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <form onSubmit={handleSubmit}>
          <IonList inset>
            <IonItem>
              <IonInput
                type="email"
                label="E-mail"
                labelPlacement="floating"
                value={email}
                onIonInput={(e) => setEmail(e.detail.value ?? '')}
                required
              />
            </IonItem>
            <IonItem>
              <IonInput
                type="password"
                label="Senha"
                labelPlacement="floating"
                value={password}
                onIonInput={(e) => setPassword(e.detail.value ?? '')}
                required
              />
            </IonItem>
          </IonList>
          {error && (
            <IonText color="danger">
              <p className="ion-padding-start">{error}</p>
            </IonText>
          )}
          <IonButton type="submit" expand="block" disabled={loading}>
            {loading ? 'Criando…' : 'Criar conta'}
          </IonButton>
        </form>

        <IonNote className="ion-padding-start">
          Já tem conta? <Link to="/login">Entrar</Link>
        </IonNote>
      </IonContent>
    </IonPage>
  )
}
