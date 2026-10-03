import { PageViews } from '@/components/layout/PageViews';
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { MotionConfig } from 'framer-motion';
import { ScrollToTop } from '@/components/layout/ScrollToTop';

import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import CmsPage from "@/pages/marketplace/static/CmsPage";
import NotFound from "@/pages/NotFound";
import Login from "@/pages/auth/Login";
import Register from "@/pages/auth/Register";
import AccountDashboard from "@/pages/account/AccountDashboard";
import AccountProfile from "@/pages/account/AccountProfile";
import AccountReservations from "@/pages/account/AccountReservations";
import AccountSaved from "@/pages/account/AccountSaved";
import AccountSettings from "@/pages/account/AccountSettings";
import AreaPage from "@/pages/marketplace/AreaPage";
import BookingFlow from "@/pages/marketplace/BookingFlow";
import Home from "@/pages/marketplace/Home";
import MapView from "@/pages/marketplace/MapView";
import PropertyDetails from "@/pages/marketplace/PropertyDetails";
import Search from "@/pages/marketplace/Search";
import Stays from "@/pages/marketplace/Stays";
import { useEffect } from "react";
import { providerUrl } from "@/utils/providerUrl";
import ForPropertyOwners from "@/pages/marketplace/static/ForPropertyOwners";
import ProviderOnboardingInfo from "@/pages/marketplace/static/ProviderOnboardingInfo";

function ProviderSignupRedirect() {
  useEffect(() => { window.location.replace(providerUrl("/signup")); }, []);
  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <MotionConfig reducedMotion="user">
      <ScrollToTop />
      <PageViews />
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
        <Route path="/signup" element={<ProviderSignupRedirect />} />

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

        <Route path="/about" element={<CmsPage slug="about" />} />
        <Route path="/help" element={<CmsPage slug="help" />} />
        <Route path="/contact" element={<CmsPage slug="contact" />} />
        <Route path="/terms" element={<CmsPage slug="terms" />} />
        <Route path="/privacy" element={<CmsPage slug="privacy" />} />
        <Route path="/cancellation-policy" element={<CmsPage slug="cancellation-policy" />} />
        <Route path="/for-property-owners" element={<ForPropertyOwners />} />
        <Route
          path="/provider-onboarding-info"
          element={<ProviderOnboardingInfo />}
        />

        <Route path="*" element={<NotFound />} />
      </Routes>
      </MotionConfig>
    </BrowserRouter>
  );
}
