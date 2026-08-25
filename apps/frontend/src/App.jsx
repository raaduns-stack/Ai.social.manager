import AppRoutes from './routes/AppRoutes'
import { AuthProvider } from './context/AuthContext'
import GlobalToast from './components/ui/GlobalToast'
import TawkChat from './components/ui/TawkChat'

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
      <GlobalToast />
      <TawkChat />
    </AuthProvider>
  )
}
