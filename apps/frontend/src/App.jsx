import AppRoutes from './routes/AppRoutes'
import { AuthProvider } from './context/AuthContext'
import GlobalToast from './components/ui/GlobalToast'

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
      <GlobalToast />
    </AuthProvider>
  )
}
