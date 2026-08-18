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

import { ApiError, login } from '../lib/api/auth'

export default function Login() {
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
      await login(email, password)
      router.push('/', 'root', 'replace')
    } catch (err) {
      setError(err instanceof ApiError ? 'Credenciais inválidas.' : 'Erro ao entrar.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>Entrar</IonTitle>
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
            {loading ? 'Entrando…' : 'Entrar'}
          </IonButton>
        </form>

        {/* Caminho para o Google: habilita ao configurar GOOGLE_OAUTH_* no backend */}
        <IonButton expand="block" fill="outline" disabled>
          Entrar com Google (a configurar)
        </IonButton>

        <IonNote className="ion-padding-start">
          Não tem conta? <Link to="/register">Cadastre-se</Link>
        </IonNote>
      </IonContent>
    </IonPage>
  )
}
