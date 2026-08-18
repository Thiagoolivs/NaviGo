import { BrowserRouter, Redirect, Route, Switch } from 'react-router-dom'

import Dashboard from './pages/Dashboard'
import Landing from './pages/Landing'
import Login from './pages/Login'
import NewTrip from './pages/NewTrip'
import PixAccount from './pages/PixAccount'
import PublicTrip from './pages/PublicTrip'
import Register from './pages/Register'
import Roster from './pages/Roster'
import Subscribe from './pages/Subscribe'
import TripDetail from './pages/TripDetail'
import TripPayment from './pages/TripPayment'

export default function App() {
  return (
    <BrowserRouter>
      <Switch>
        {/* Público */}
        <Route exact path="/" component={Landing} />
        <Route exact path="/login" component={Login} />
        <Route exact path="/register" component={Register} />
        <Route exact path="/trip/:slug" component={PublicTrip} />
        <Route exact path="/trip/:slug/inscricao" component={Subscribe} />
        <Route exact path="/trip/:slug/pagamento" component={TripPayment} />

        {/* Organizador (autenticado) */}
        <Route exact path="/app" component={Dashboard} />
        <Route exact path="/app/viagens/nova" component={NewTrip} />
        <Route exact path="/app/viagens/:id" component={TripDetail} />
        <Route exact path="/app/viagens/:id/participantes" component={Roster} />
        <Route exact path="/pix-account" component={PixAccount} />

        <Route render={() => <Redirect to="/" />} />
      </Switch>
    </BrowserRouter>
  )
}
