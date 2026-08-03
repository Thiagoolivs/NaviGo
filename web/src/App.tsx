import { IonApp, IonRouterOutlet, setupIonicReact } from '@ionic/react'
import { IonReactRouter } from '@ionic/react-router'
import { Redirect, Route } from 'react-router-dom'

import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import PublicTrip from './pages/PublicTrip'
import Register from './pages/Register'

setupIonicReact()

export default function App() {
  return (
    <IonApp>
      <IonReactRouter>
        <IonRouterOutlet>
          {/* Painel do organizador (autenticado, no futuro) */}
          <Route exact path="/" component={Dashboard} />
          {/* Autenticação */}
          <Route exact path="/login" component={Login} />
          <Route exact path="/register" component={Register} />
          {/* Página pública da viagem, acessada por link/QR */}
          <Route exact path="/trip/:slug" component={PublicTrip} />
          <Route render={() => <Redirect to="/" />} />
        </IonRouterOutlet>
      </IonReactRouter>
    </IonApp>
  )
}
