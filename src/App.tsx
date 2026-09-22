import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '@/contexts/AuthContext'
import { ConfirmProvider } from '@/contexts/ConfirmContext'
import { ToastProvider } from '@/contexts/ToastContext'
import { AppRoutes } from '@/routes/AppRoutes'

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <AuthProvider>
        <ToastProvider>
          <ConfirmProvider>
            <AppRoutes />
          </ConfirmProvider>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
