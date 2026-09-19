import { BrowserRouter, Route, Routes } from 'react-router-dom'

import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import NotFound from '@/pages/NotFound'
import Login from '@/pages/auth/Login'
import Register from '@/pages/auth/Register'
import AccountDashboard from '@/pages/account/AccountDashboard'
import AccountProfile from '@/pages/account/AccountProfile'
import AccountReservations from '@/pages/account/AccountReservations'
import AccountSaved from '@/pages/account/AccountSaved'
import AccountSettings from '@/pages/account/AccountSettings'
import AreaPage from '@/pages/marketplace/AreaPage'
import BookingFlow from '@/pages/marketplace/BookingFlow'
import Home from '@/pages/marketplace/Home'
import MapView from '@/pages/marketplace/MapView'
import PropertyDetails from '@/pages/marketplace/PropertyDetails'
import Search from '@/pages/marketplace/Search'
import Stays from '@/pages/marketplace/Stays'
import About from '@/pages/marketplace/static/About'
import CancellationPolicy from '@/pages/marketplace/static/CancellationPolicy'
import Contact from '@/pages/marketplace/static/Contact'
import ForPropertyOwners from '@/pages/marketplace/static/ForPropertyOwners'
import Help from '@/pages/marketplace/static/Help'
import Privacy from '@/pages/marketplace/static/Privacy'
import Terms from '@/pages/marketplace/static/Terms'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/search" element={<Search />} />
        <Route path="/stays" element={<Stays />} />
        <Route path="/map" element={<MapView />} />
        <Route path="/kabul/:area" element={<AreaPage />} />
        <Route path="/property/:slug" element={<PropertyDetails />} />
        <Route path="/book/:slug/:roomId" element={<BookingFlow />} />

        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route
          path="/account"
          element={
            <ProtectedRoute>
              <AccountDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/account/reservations"
          element={
            <ProtectedRoute>
              <AccountReservations />
            </ProtectedRoute>
          }
        />
        <Route
          path="/account/saved"
          element={
            <ProtectedRoute>
              <AccountSaved />
            </ProtectedRoute>
          }
        />
        <Route
          path="/account/profile"
          element={
            <ProtectedRoute>
              <AccountProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/account/settings"
          element={
            <ProtectedRoute>
              <AccountSettings />
            </ProtectedRoute>
          }
        />

        <Route path="/about" element={<About />} />
        <Route path="/help" element={<Help />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/cancellation-policy" element={<CancellationPolicy />} />
        <Route path="/for-property-owners" element={<ForPropertyOwners />} />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  )
}
