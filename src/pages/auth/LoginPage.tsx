import { AlertCircle, Eye, EyeOff } from 'lucide-react'
import { type FormEvent, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useAuth } from '@/hooks/useAuth'
import { isSupabaseConfigured } from '@/lib/supabase'

interface LocationState {
  from?: { pathname: string }
}

export function LoginPage() {
  const { signIn, session, loading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<{ identifier?: string; password?: string }>({})

  if (!loading && session) {
    const from = (location.state as LocationState | null)?.from?.pathname
    return <Navigate to={from ?? '/'} replace />
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setFormError(null)

    const errors: typeof fieldErrors = {}
    if (!identifier.trim()) errors.identifier = 'Ingresa tu usuario o correo electrónico.'
    if (!password) errors.password = 'Ingresa tu contraseña.'

    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return

    setSubmitting(true)
    const { error } = await signIn(identifier.trim(), password)
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
          label="Usuario o correo electrónico"
          type="text"
          autoComplete="username"
          placeholder="Tu usuario, o tu correo si eres administrador"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          error={fieldErrors.identifier}
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

      <p className="mt-5 text-center text-xs text-neutral-400">
        Estudiantes y acudientes: si olvidaste tu contraseña, pídele a la institución que te genere
        una nueva. El enlace de recuperación es solo para el correo del administrador.
      </p>
    </div>
  )
}
