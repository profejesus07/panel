import { Copy, Eye, EyeOff, KeyRound, Wand2 } from 'lucide-react'
import { type FormEvent, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { useToast } from '@/hooks/useToast'
import { createUserAccount, generateTemporaryPassword } from '@/services/userAccounts.service'

interface CreateAccessModalProps {
  open: boolean
  onClose: () => void
  role: 'estudiante' | 'padre'
  linkId: string
  defaultFullName: string
  username: string
  onCreated: () => void
}

export function CreateAccessModal({
  open,
  onClose,
  role,
  linkId,
  defaultFullName,
  username,
  onCreated,
}: CreateAccessModalProps) {
  const { showToast } = useToast()
  const [password, setPassword] = useState(() => generateTemporaryPassword())
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<{ password?: string }>({})
  const [saving, setSaving] = useState(false)
  const [created, setCreated] = useState(false)

  function validate(): boolean {
    const next: typeof errors = {}
    if (password.length < 8) next.password = 'La contraseña debe tener al menos 8 caracteres.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!validate()) return

    setSaving(true)
    try {
      await createUserAccount({
        username,
        password,
        fullName: defaultFullName,
        role,
        linkId,
      })
      setCreated(true)
      onCreated()
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : 'No se pudo crear la cuenta.')
    } finally {
      setSaving(false)
    }
  }

  async function handleCopyPassword() {
    try {
      await navigator.clipboard.writeText(password)
      showToast('success', 'Contraseña copiada al portapapeles.')
    } catch {
      showToast('error', 'No se pudo copiar la contraseña.')
    }
  }

  function handleClose() {
    setCreated(false)
    setPassword(generateTemporaryPassword())
    setErrors({})
    onClose()
  }

  if (created) {
    return (
      <Modal open={open} onClose={handleClose} title="Cuenta creada" size="sm">
        <div className="space-y-4 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-success-50 text-success-600">
            <KeyRound className="h-6 w-6" />
          </div>
          <p className="text-sm text-neutral-600">
            Comparte estas credenciales con {defaultFullName} de forma segura. Guárdalas bien: si
            las olvida, tendrás que generarle una contraseña nueva desde aquí.
          </p>
          <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 text-left text-sm">
            <p>
              <span className="text-neutral-500">Usuario:</span>{' '}
              <span className="font-medium text-neutral-900">{username}</span>
            </p>
            <p className="mt-1 flex items-center gap-2">
              <span className="text-neutral-500">Contraseña:</span>{' '}
              <span className="font-mono font-medium text-neutral-900">{password}</span>
              <button
                type="button"
                onClick={() => void handleCopyPassword()}
                className="ml-auto rounded-md p-1 text-neutral-400 hover:bg-neutral-200 hover:text-neutral-600"
                aria-label="Copiar contraseña"
              >
                <Copy className="h-4 w-4" />
              </button>
            </p>
          </div>
          <Button onClick={handleClose} className="w-full">
            Cerrar
          </Button>
        </div>
      </Modal>
    )
  }

  return (
    <Modal open={open} onClose={handleClose} title="Crear acceso" size="sm">
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <p className="text-sm text-neutral-500">
          Se creará una cuenta para <span className="font-medium text-neutral-700">{defaultFullName}</span>.
        </p>
        <div>
          <p className="mb-1.5 text-sm font-medium text-neutral-700">Usuario de acceso</p>
          <p className="rounded-lg border border-neutral-200 bg-neutral-50 px-3.5 py-2.5 font-mono text-sm text-neutral-700">
            {username}
          </p>
          <p className="mt-1.5 text-xs text-neutral-400">
            Se calcula solo a partir de {role === 'estudiante' ? 'su código estudiantil' : 'su documento'}, no se puede cambiar aquí.
          </p>
        </div>
        <div className="relative">
          <Input
            label="Contraseña inicial"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
          />
          <div className="absolute right-3.5 top-9 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPassword(generateTemporaryPassword())}
              className="text-neutral-400 hover:text-neutral-600"
              title="Generar otra contraseña"
            >
              <Wand2 className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="text-neutral-400 hover:text-neutral-600"
              title={showPassword ? 'Ocultar' : 'Mostrar'}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={saving}>
            <KeyRound className="h-4 w-4" />
            Crear acceso
          </Button>
        </div>
      </form>
    </Modal>
  )
}
