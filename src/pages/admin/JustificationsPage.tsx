import { Check, Eye, FileText, X } from 'lucide-react'
import { useState } from 'react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Pagination } from '@/components/ui/Pagination'
import { RowActions } from '@/components/ui/RowActions'
import { Select } from '@/components/ui/Select'
import { Table, type TableColumn } from '@/components/ui/Table'
import { Textarea } from '@/components/ui/Textarea'
import { useConfirm } from '@/hooks/useConfirm'
import { useListQuery } from '@/hooks/useListQuery'
import { useToast } from '@/hooks/useToast'
import {
  approveJustification,
  getJustificationAttachmentUrl,
  listJustifications,
  rejectJustification,
  type Justification,
  type JustificationWithStudent,
} from '@/services/justifications.service'
import { studentFullName } from '@/services/students.service'
import { Constants } from '@/types/database.types'
import { DEFAULT_PAGE_SIZE } from '@/types/common'
import { JUSTIFICATION_STATUS_LABELS } from '@/utils/labels'

const STATUS_BADGE_VARIANT: Record<Justification['status'], 'warning' | 'success' | 'danger'> = {
  pendiente: 'warning',
  aprobada: 'success',
  rechazada: 'danger',
}

export function JustificationsPage() {
  const { showToast } = useToast()
  const confirm = useConfirm()

  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState<Justification['status'] | ''>('pendiente')
  const [detail, setDetail] = useState<JustificationWithStudent | null>(null)
  const [reviewNotes, setReviewNotes] = useState('')
  const [processing, setProcessing] = useState(false)

  const {
    data: justifications,
    count: total,
    loading,
    reload,
  } = useListQuery(
    { page, pageSize: DEFAULT_PAGE_SIZE, status: statusFilter || undefined },
    listJustifications,
    () => showToast('error', 'No se pudieron cargar las justificaciones.'),
  )

  function openDetail(j: JustificationWithStudent) {
    setDetail(j)
    setReviewNotes(j.review_notes ?? '')
  }

  async function handleViewAttachment(path: string) {
    try {
      const url = await getJustificationAttachmentUrl(path)
      window.open(url, '_blank', 'noopener,noreferrer')
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : 'No se pudo abrir el archivo.')
    }
  }

  async function handleApprove(j: JustificationWithStudent) {
    setProcessing(true)
    try {
      await approveJustification(j.id, reviewNotes)
      showToast('success', 'Justificación aprobada. La asistencia del día quedó actualizada.')
      setDetail(null)
      reload()
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : 'No se pudo aprobar la justificación.')
    } finally {
      setProcessing(false)
    }
  }

  async function handleReject(j: JustificationWithStudent) {
    const confirmed = await confirm({
      title: '¿Rechazar esta justificación?',
      description: 'El estudiante y su acudiente verán que fue rechazada.',
      confirmLabel: 'Rechazar',
      variant: 'danger',
    })
    if (!confirmed) return

    setProcessing(true)
    try {
      await rejectJustification(j.id, reviewNotes)
      showToast('success', 'Justificación rechazada.')
      setDetail(null)
      reload()
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : 'No se pudo rechazar la justificación.')
    } finally {
      setProcessing(false)
    }
  }

  const columns: TableColumn<JustificationWithStudent>[] = [
    {
      key: 'student',
      header: 'Estudiante',
      render: (j) => (j.students ? studentFullName(j.students) : '—'),
    },
    { key: 'absence_date', header: 'Fecha de ausencia', render: (j) => j.absence_date },
    { key: 'reason', header: 'Motivo', render: (j) => <span className="line-clamp-1">{j.reason}</span> },
    {
      key: 'status',
      header: 'Estado',
      render: (j) => (
        <Badge variant={STATUS_BADGE_VARIANT[j.status]}>{JUSTIFICATION_STATUS_LABELS[j.status]}</Badge>
      ),
    },
    {
      key: 'requested_at',
      header: 'Solicitada',
      render: (j) => new Date(j.requested_at).toLocaleDateString('es-CO'),
    },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (j) => (
        <RowActions
          actions={[
            { label: 'Ver detalle', icon: <Eye className="h-4 w-4" />, onClick: () => openDetail(j) },
          ]}
        />
      ),
    },
  ]

  return (
    <div>
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Justificaciones</h1>
          <p className="text-sm text-neutral-500">Revisa y aprueba o rechaza las inasistencias justificadas.</p>
        </div>
        <Select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value as Justification['status'] | '')
            setPage(1)
          }}
          className="sm:w-56"
        >
          <option value="">Todos los estados</option>
          {Constants.public.Enums.justification_status.map((status) => (
            <option key={status} value={status}>
              {JUSTIFICATION_STATUS_LABELS[status]}
            </option>
          ))}
        </Select>
      </div>

      <Table
        columns={columns}
        data={justifications}
        keyField={(j) => j.id}
        loading={loading}
        emptyTitle="No hay justificaciones"
        emptyDescription="Las solicitudes enviadas por padres o estudiantes aparecerán aquí."
        onRowClick={openDetail}
      />
      <Pagination page={page} pageSize={DEFAULT_PAGE_SIZE} total={total} onPageChange={setPage} />

      <Modal
        open={Boolean(detail)}
        onClose={() => setDetail(null)}
        title="Detalle de la justificación"
        size="md"
      >
        {detail && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-neutral-500">Estudiante</p>
                <p className="font-medium text-neutral-900">
                  {detail.students ? studentFullName(detail.students) : '—'}
                </p>
              </div>
              <div>
                <p className="text-neutral-500">Fecha de ausencia</p>
                <p className="font-medium text-neutral-900">{detail.absence_date}</p>
              </div>
              <div>
                <p className="text-neutral-500">Estado</p>
                <Badge variant={STATUS_BADGE_VARIANT[detail.status]}>
                  {JUSTIFICATION_STATUS_LABELS[detail.status]}
                </Badge>
              </div>
              <div>
                <p className="text-neutral-500">Solicitada</p>
                <p className="font-medium text-neutral-900">
                  {new Date(detail.requested_at).toLocaleString('es-CO')}
                </p>
              </div>
            </div>

            <div>
              <p className="mb-1 text-sm text-neutral-500">Motivo</p>
              <p className="text-sm text-neutral-900">{detail.reason}</p>
            </div>

            {detail.description && (
              <div>
                <p className="mb-1 text-sm text-neutral-500">Descripción</p>
                <p className="text-sm text-neutral-900">{detail.description}</p>
              </div>
            )}

            {detail.attachment_url && (
              <button
                type="button"
                onClick={() => void handleViewAttachment(detail.attachment_url!)}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-700 hover:text-brand-800"
              >
                <FileText className="h-4 w-4" />
                Ver archivo adjunto
              </button>
            )}

            <Textarea
              label="Observaciones de revisión"
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              placeholder="Opcional: agrega una nota sobre tu decisión."
            />

            {detail.status === 'pendiente' && (
              <div className="flex justify-end gap-3 border-t border-neutral-200 pt-4">
                <Button
                  variant="danger"
                  onClick={() => void handleReject(detail)}
                  loading={processing}
                >
                  <X className="h-4 w-4" />
                  Rechazar
                </Button>
                <Button onClick={() => void handleApprove(detail)} loading={processing}>
                  <Check className="h-4 w-4" />
                  Aprobar
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
