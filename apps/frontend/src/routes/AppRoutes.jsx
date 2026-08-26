import { Routes, Route, Navigate } from 'react-router-dom'
import { usePageTracking } from '../hooks/useAnalytics'

// Layouts
import AuthLayout from '../layouts/AuthLayout'
import OnboardingLayout from '../layouts/OnboardingLayout'
import DashboardLayout from '../layouts/DashboardLayout'
import MarketingLayout from '../layouts/MarketingLayout'

// Public pages
import Landing from '../pages/Landing'
import Features from '../pages/Features'
import Pricing from '../pages/Pricing'
import Contact from '../pages/Contact'
import PrivacyPolicy from '../pages/PrivacyPolicy'
import TermsOfService from '../pages/TermsOfService'

// Auth pages
import Login from '../pages/Auth/Login'
import SignUp from '../pages/Auth/SignUp'
import ForgotPassword from '../pages/Auth/ForgotPassword'

// Onboarding pages
import VerifyEmail from '../pages/Onboarding/VerifyEmail'
import Welcome from '../pages/Onboarding/Welcome'
import BusinessInfo from '../pages/Onboarding/BusinessInfo'
import ChoosePlan from '../pages/Onboarding/ChoosePlan'
import Payment from '../pages/Onboarding/Payment'
import PaymentVerification from '../pages/Onboarding/PaymentVerification'
import PaymentCallbackPage from '../features/payments/payment-callback-page'

// Dashboard pages
import DashboardHome from '../pages/Dashboard/DashboardHome'
import Analytics from '../pages/Dashboard/Analytics'
import Channels from '../pages/Dashboard/Channels'
import ContentCalendar from '../pages/Dashboard/ContentCalendar'
import Uploads from '../pages/Dashboard/Uploads'
import AISuggestions from '../pages/Dashboard/AISuggestions'
import Billing from '../pages/Dashboard/Billing'
import AdminMoneyManagement from "../pages/Dashboard/MoneyManagement"; // 👈 FIXED: correct folder
import Support from '../pages/Dashboard/Support'
import Notifications from '../pages/Dashboard/Notifications'
import Settings from '../pages/Dashboard/Settings'
import AdminRoutes from './AdminRoutes'

/**
 * Central route map. This mirrors the 20-prompt Stitch sequence 1:1 —
 * when you convert a Stitch page, its route is already here.
 *
 * NOTE: This does not yet enforce "must have active subscription to reach
 * /dashboard". Wrap the DashboardLayout route in a <RequireSubscription>
 * guard once auth/billing state exists (see AuthContext.jsx placeholder).
 */
export default function AppRoutes() {
  usePageTracking()

  return (
    <Routes>
      {/* Public marketing pages */}
      <Route element={<MarketingLayout />}>
        <Route path="/" element={<Landing />} />
        <Route path="/features" element={<Features />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/terms-of-service" element={<TermsOfService />} />
      </Route>

      {/* Auth (split-screen layout) */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
      </Route>

      {/* Payment Callback standalone page */}
      <Route path="/payments/callback" element={<PaymentCallbackPage />} />

      {/* Onboarding / billing gate (centered, minimal-nav layout) */}
      <Route element={<OnboardingLayout />}>
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/welcome" element={<Welcome />} />
        <Route path="/setup/business" element={<BusinessInfo />} />
        <Route path="/choose-plan" element={<ChoosePlan />} />
        <Route path="/payment" element={<Payment />} />
        <Route path="/payment-verification" element={<PaymentVerification />} />
      </Route>

      {/* Dashboard (sidebar + navbar shell) */}
      <Route path="/dashboard" element={<DashboardLayout />}>
        <Route index element={<DashboardHome />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="channels" element={<Channels />} />
        <Route path="calendar" element={<ContentCalendar />} />
        <Route path="uploads" element={<Uploads />} />
        <Route path="billing" element={<Billing />} />
        <Route path="support" element={<Support />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="settings" element={<Settings />} />
      </Route>

      {/* Redirect for Tumblr OAuth callback URL */}
      <Route
        path="/settings/accounts"
        element={<Navigate to={{ pathname: "/dashboard/channels", search: window.location.search }} replace />}
      />

      {/* Admin Panel */}
      <Route path="/admin/*" element={<AdminRoutes />} />
    </Routes>
  )
}
