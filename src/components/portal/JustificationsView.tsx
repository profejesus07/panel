import { FileCheck2, Plus, Upload } from 'lucide-react'
import { type FormEvent, useEffect, useState } from 'react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Skeleton } from '@/components/ui/Skeleton'
import { Textarea } from '@/components/ui/Textarea'
import { useToast } from '@/hooks/useToast'
import {
  getJustificationAttachmentUrl,
  listJustificationsForStudent,
  submitJustification,
  uploadJustificationAttachment,
  type Justification,
} from '@/services/justifications.service'
import { JUSTIFICATION_STATUS_LABELS } from '@/utils/labels'

const STATUS_BADGE_VARIANT: Record<Justification['status'], 'warning' | 'success' | 'danger'> = {
  pendiente: 'warning',
  aprobada: 'success',
  rechazada: 'danger',
}

export function JustificationsView({ studentId }: { studentId: string }) {
  const { showToast } = useToast()
  const [records, setRecords] = useState<Justification[]>([])
  const [version, setVersion] = useState(0)
  const [loadedKey, setLoadedKey] = useState<string | null>(null)
  const key = `${studentId}:${version}`
  const loading = loadedKey !== key

  const [modalOpen, setModalOpen] = useState(false)
  const [absenceDate, setAbsenceDate] = useState('')
  const [reason, setReason] = useState('')
  const [description, setDescription] = useState('')
  const [attachmentPath, setAttachmentPath] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [errors, setErrors] = useState<{ absenceDate?: string; reason?: string }>({})
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let active = true
    listJustificationsForStudent(studentId)
      .then((result) => {
        if (!active) return
        setRecords(result)
        setLoadedKey(key)
      })
      .catch(() => {
        if (!active) return
        showToast('error', 'No se pudieron cargar las justificaciones.')
        setLoadedKey(key)
      })
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  function openForm() {
    setAbsenceDate('')
    setReason('')
    setDescription('')
    setAttachmentPath(null)
    setErrors({})
    setModalOpen(true)
  }

  async function handleFileChange(file: File | undefined) {
    if (!file) return
    setUploading(true)
    try {
      const path = await uploadJustificationAttachment(file, studentId)
      setAttachmentPath(path)
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : 'No se pudo subir el archivo.')
    } finally {
      setUploading(false)
    }
  }

  async function handleViewAttachment(path: string) {
    try {
      const url = await getJustificationAttachmentUrl(path)
      window.open(url, '_blank', 'noopener,noreferrer')
    } catch {
      showToast('error', 'No se pudo abrir el archivo.')
    }
  }

  function validate(): boolean {
    const next: typeof errors = {}
    if (!absenceDate) next.absenceDate = 'La fecha de ausencia es obligatoria.'
    if (!reason.trim()) next.reason = 'El motivo es obligatorio.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!validate()) return

    setSubmitting(true)
    try {
      await submitJustification({
        studentId,
        absenceDate,
        reason: reason.trim(),
        description: description.trim() || undefined,
        attachmentUrl: attachmentPath,
      })
      showToast('success', 'Justificación enviada. El administrador la revisará pronto.')
      setModalOpen(false)
      setVersion((v) => v + 1)
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : 'No se pudo enviar la justificación.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button onClick={openForm}>
          <Plus className="h-4 w-4" />
          Nueva justificación
        </Button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : records.length === 0 ? (
        <EmptyState
          icon={FileCheck2}
          title="Sin justificaciones enviadas"
          description="Cuando envíes una justificación de inasistencia, aparecerá aquí."
        />
      ) : (
        <ul className="space-y-3">
          {records.map((record) => (
            <li key={record.id} className="rounded-xl border border-neutral-200 bg-white p-4">
              <div className="mb-1 flex items-center justify-between gap-2">
                <p className="font-medium text-neutral-900">Ausencia del {record.absence_date}</p>
                <Badge variant={STATUS_BADGE_VARIANT[record.status]}>
                  {JUSTIFICATION_STATUS_LABELS[record.status]}
                </Badge>
              </div>
              <p className="text-sm text-neutral-600">{record.reason}</p>
              {record.review_notes && (
                <p className="mt-1.5 text-sm text-neutral-500">
                  <span className="font-medium">Respuesta del colegio:</span> {record.review_notes}
                </p>
              )}
              {record.attachment_url && (
                <button
                  type="button"
                  onClick={() => void handleViewAttachment(record.attachment_url!)}
                  className="mt-2 text-sm font-medium text-brand-700 hover:text-brand-800"
                >
                  Ver archivo adjunto
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nueva justificación">
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <Input
            label="Fecha de la ausencia"
            type="date"
            value={absenceDate}
            onChange={(e) => setAbsenceDate(e.target.value)}
            error={errors.absenceDate}
          />
          <Input
            label="Motivo"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            error={errors.reason}
            placeholder="Ej. Cita médica"
          />
          <Textarea
            label="Descripción (opcional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <div>
            <p className="mb-1.5 text-sm font-medium text-neutral-700">Archivo adjunto (opcional)</p>
            <label htmlFor="justification-attachment">
              <span className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-neutral-300 px-3.5 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50">
                <Upload className="h-4 w-4" />
                {uploading ? 'Subiendo...' : attachmentPath ? 'Reemplazar archivo' : 'Subir archivo'}
              </span>
              <input
                id="justification-attachment"
                type="file"
                accept="application/pdf,image/png,image/jpeg"
                className="hidden"
                disabled={uploading}
                onChange={(e) => void handleFileChange(e.target.files?.[0])}
              />
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" loading={submitting}>
              Enviar justificación
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
