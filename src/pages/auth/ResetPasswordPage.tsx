import { AlertCircle, CheckCircle2 } from 'lucide-react'
import { type FormEvent, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Spinner } from '@/components/ui/Spinner'
import { supabase } from '@/lib/supabase'

type Status = 'checking' | 'ready' | 'invalid'

export function ResetPasswordPage() {
  const navigate = useNavigate()
  const [status, setStatus] = useState<Status>('checking')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    let settled = false

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && session)) {
        settled = true
        setStatus('ready')
      }
    })

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        settled = true
        setStatus('ready')
      }
    })

    const timeout = setTimeout(() => {
      if (!settled) setStatus('invalid')
    }, 4000)

    return () => {
      subscription.unsubscribe()
      clearTimeout(timeout)
    }
  }, [])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.')
      return
    }
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.')
      return
    }

    setSubmitting(true)
    const { error: updateError } = await supabase.auth.updateUser({ password })

    if (updateError) {
      setSubmitting(false)
      setError('No se pudo actualizar la contraseña. Solicita un nuevo enlace e inténtalo de nuevo.')
      return
    }

    setSuccess(true)
    await supabase.auth.signOut()
    setTimeout(() => navigate('/login', { replace: true }), 2000)
  }

  if (status === 'checking') {
    return (
      <div className="flex flex-col items-center py-6 text-center">
        <Spinner className="mb-4 h-6 w-6" />
        <p className="text-sm text-neutral-500">Verificando el enlace de recuperación...</p>
      </div>
    )
  }

  if (status === 'invalid') {
    return (
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-danger-50 text-danger-600">
          <AlertCircle className="h-6 w-6" />
        </div>
        <h2 className="mb-1 text-lg font-semibold text-neutral-900">Enlace inválido o expirado</h2>
        <p className="mb-6 text-sm text-neutral-500">
          Solicita un nuevo enlace de recuperación e inténtalo de nuevo.
        </p>
        <Link
          to="/recuperar-password"
          className="text-sm font-medium text-brand-700 hover:text-brand-800"
        >
          Solicitar nuevo enlace
        </Link>
      </div>
    )
  }

  if (success) {
    return (
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-success-50 text-success-600">
          <CheckCircle2 className="h-6 w-6" />
        </div>
        <h2 className="mb-1 text-lg font-semibold text-neutral-900">Contraseña actualizada</h2>
        <p className="text-sm text-neutral-500">Redirigiendo al inicio de sesión...</p>
      </div>
    )
  }

  return (
    <div>
      <h2 className="mb-1 text-lg font-semibold text-neutral-900">Nueva contraseña</h2>
      <p className="mb-6 text-sm text-neutral-500">Elige una nueva contraseña para tu cuenta.</p>

      {error && (
        <div className="mb-5 flex items-start gap-2 rounded-lg border border-danger-200 bg-danger-50 px-3.5 py-3 text-sm text-danger-600">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Input
          label="Nueva contraseña"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          hint="Mínimo 8 caracteres."
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={submitting}
        />
        <Input
          label="Confirmar contraseña"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          disabled={submitting}
        />
        <Button type="submit" className="w-full" loading={submitting}>
          Actualizar contraseña
        </Button>
      </form>
    </div>
  )
}
