import { ArrowLeft, CheckCircle2 } from 'lucide-react'
import { type FormEvent, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { supabase } from '@/lib/supabase'
import { isValidEmail } from '@/utils/validation'

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)

    if (!isValidEmail(email)) {
      setError('Ingresa un correo válido.')
      return
    }

    setSubmitting(true)
    const { error: authError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/recuperar-password/confirmar`,
    })
    setSubmitting(false)

    if (authError) {
      setError('No se pudo enviar el correo de recuperación. Inténtalo de nuevo.')
      return
    }

    setSent(true)
  }

  if (sent) {
    return (
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-success-50 text-success-600">
          <CheckCircle2 className="h-6 w-6" />
        </div>
        <h2 className="mb-1 text-lg font-semibold text-neutral-900">Revisa tu correo</h2>
        <p className="mb-6 text-sm text-neutral-500">
          Si existe una cuenta asociada a <strong>{email}</strong>, recibirás un enlace para
          restablecer tu contraseña.
        </p>
        <Link to="/login" className="text-sm font-medium text-brand-700 hover:text-brand-800">
          Volver al inicio de sesión
        </Link>
      </div>
    )
  }

  return (
    <div>
      <h2 className="mb-1 text-lg font-semibold text-neutral-900">Recuperar contraseña</h2>
      <p className="mb-6 text-sm text-neutral-500">
        Ingresa tu correo y te enviaremos instrucciones para restablecerla.
      </p>

      {error && (
        <div className="mb-5 rounded-lg border border-danger-200 bg-danger-50 px-3.5 py-3 text-sm text-danger-600">
          {error}
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
          disabled={submitting}
        />
        <Button type="submit" className="w-full" loading={submitting}>
          Enviar instrucciones
        </Button>
      </form>

      <Link
        to="/login"
        className="mt-6 flex items-center justify-center gap-1.5 text-sm font-medium text-neutral-600 hover:text-neutral-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver al inicio de sesión
      </Link>
    </div>
  )
}
