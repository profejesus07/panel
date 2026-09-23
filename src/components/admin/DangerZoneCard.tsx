import { AlertTriangle, Trash2 } from 'lucide-react'
import { type FormEvent, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { useToast } from '@/hooks/useToast'
import { RESET_CONFIRMATION_PHRASE, resetDatabase } from '@/services/databaseReset.service'

const WHAT_IS_DELETED = [
  'Todas las cuentas de acceso de estudiantes, padres y otros administradores',
  'Estudiantes, padres y acudientes, y cursos',
  'Calificaciones, asistencia, justificaciones y convivencia',
  'Actas, anuncios, boletines y todos sus archivos adjuntos',
]

export function DangerZoneCard() {
  const { showToast } = useToast()
  const [open, setOpen] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState(false)

  const canSubmit = confirmation === RESET_CONFIRMATION_PHRASE && password.length > 0

  function close() {
    if (deleting) return
    setOpen(false)
    setPassword('')
    setConfirmation('')
    setError('')
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!canSubmit) return

    setDeleting(true)
    setError('')
    try {
      const deletedUsers = await resetDatabase(password, confirmation)
      showToast(
        'success',
        `Base de datos eliminada. Se borraron ${deletedUsers} cuentas de acceso; solo queda la tuya.`,
      )
      setOpen(false)
      // Recarga para que ninguna pantalla muestre datos ya eliminados.
      window.setTimeout(() => window.location.reload(), 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo eliminar la base de datos.')
      setDeleting(false)
    }
  }

  return (
    <Card className="border-danger-500/30">
      <CardHeader>
        <CardTitle>
          <span className="flex items-center gap-2 text-danger-700">
            <AlertTriangle className="h-5 w-5" />
            Zona de peligro
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-neutral-900">Eliminar toda la base de datos</p>
          <p className="text-sm text-neutral-500">
            Borra toda la información del colegio y todas las cuentas de acceso, excepto la tuya. No
            se puede deshacer.
          </p>
        </div>
        <Button variant="danger" className="shrink-0" onClick={() => setOpen(true)}>
          <Trash2 className="h-4 w-4" />
          Eliminar base de datos
        </Button>
      </CardContent>

      <Modal
        open={open}
        onClose={close}
        title="Eliminar toda la base de datos"
        description="Esta acción es permanente y no se puede deshacer."
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="rounded-lg border border-danger-500/30 bg-danger-50 p-3.5 text-sm text-danger-700">
            <p className="mb-2 font-semibold">Se eliminará:</p>
            <ul className="list-disc space-y-1 pl-5">
              {WHAT_IS_DELETED.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <p className="mt-2">
              Se conservan tu cuenta de administrador, los datos y el escudo del colegio, las
              asignaturas, los períodos y la escala de valoración.
            </p>
          </div>

          <Input
            label="Tu contraseña"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Input
            label={`Escribe ${RESET_CONFIRMATION_PHRASE} para confirmar`}
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
            placeholder={RESET_CONFIRMATION_PHRASE}
            autoComplete="off"
            error={error}
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={close} disabled={deleting}>
              Cancelar
            </Button>
            <Button type="submit" variant="danger" loading={deleting} disabled={!canSubmit}>
              Eliminar definitivamente
            </Button>
          </div>
        </form>
      </Modal>
    </Card>
  )
}
