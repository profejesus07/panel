import { AlertCircle, Eye, EyeOff } from 'lucide-react'
import { type FormEvent, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useAuth } from '@/hooks/useAuth'
import { isSupabaseConfigured } from '@/lib/supabase'
import { isValidEmail } from '@/utils/validation'

interface LocationState {
  from?: { pathname: string }
}

export function LoginPage() {
  const { signIn, session, loading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({})

  if (!loading && session) {
    const from = (location.state as LocationState | null)?.from?.pathname
    return <Navigate to={from ?? '/'} replace />
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setFormError(null)

    const errors: typeof fieldErrors = {}
    if (!email.trim()) errors.email = 'Ingresa tu correo electrónico.'
    else if (!isValidEmail(email)) errors.email = 'Ingresa un correo válido.'
    if (!password) errors.password = 'Ingresa tu contraseña.'

    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return

    setSubmitting(true)
    const { error } = await signIn(email.trim(), password)
    setSubmitting(false)

    if (error) {
      setFormError(error)
      return
    }

    navigate('/', { replace: true })
  }

  return (
    <div>
      <h2 className="mb-1 text-lg font-semibold text-neutral-900">Iniciar sesión</h2>
      <p className="mb-6 text-sm text-neutral-500">
        Ingresa tus credenciales para acceder al panel.
      </p>

      {!isSupabaseConfigured && (
        <div className="mb-5 flex items-start gap-2 rounded-lg border border-accent-200 bg-accent-50 px-3.5 py-3 text-sm text-accent-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Supabase no está configurado todavía. Completa las variables de entorno en{' '}
            <code className="rounded bg-white/60 px-1 py-0.5 font-mono text-xs">.env</code> para
            habilitar el inicio de sesión.
          </span>
        </div>
      )}

      {formError && (
        <div className="mb-5 flex items-start gap-2 rounded-lg border border-danger-200 bg-danger-50 px-3.5 py-3 text-sm text-danger-600">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Input
          label="Correo electrónico"
          type="email"
          autoComplete="email"
          placeholder="nombre@colegio.edu.co"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={fieldErrors.email}
          disabled={submitting}
        />

        <div className="relative">
          <Input
            label="Contraseña"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={fieldErrors.password}
            disabled={submitting}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3.5 top-9 text-neutral-400 hover:text-neutral-600"
            tabIndex={-1}
            aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>

        <div className="flex justify-end">
          <Link
            to="/recuperar-password"
            className="text-sm font-medium text-brand-700 hover:text-brand-800"
          >
            ¿Olvidaste tu contraseña?
          </Link>
        </div>

        <Button type="submit" className="w-full" loading={submitting}>
          Iniciar sesión
        </Button>
      </form>
    </div>
  )
}
