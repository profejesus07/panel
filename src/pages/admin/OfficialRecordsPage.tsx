import { FileSignature, Pencil, Trash2, Upload } from 'lucide-react'
import { type FormEvent, useState } from 'react'
import { AudienceFields } from '@/components/admin/AudienceFields'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Pagination } from '@/components/ui/Pagination'
import { RowActions } from '@/components/ui/RowActions'
import { Select } from '@/components/ui/Select'
import { Table, type TableColumn } from '@/components/ui/Table'
import { Textarea } from '@/components/ui/Textarea'
import { useConfirm } from '@/hooks/useConfirm'
import { useListQuery } from '@/hooks/useListQuery'
import { useSimpleQuery } from '@/hooks/useSimpleQuery'
import { useToast } from '@/hooks/useToast'
import { listActiveCourses } from '@/services/courses.service'
import {
  createOfficialRecord,
  deleteOfficialRecord,
  getOfficialRecordSignedUrl,
  listOfficialRecords,
  updateOfficialRecord,
  uploadOfficialRecordDocument,
  type OfficialRecord,
  type OfficialRecordInput,
} from '@/services/officialRecords.service'
import type { StudentWithCourse } from '@/services/students.service'
import { Constants } from '@/types/database.types'
import { DEFAULT_PAGE_SIZE } from '@/types/common'
import { AUDIENCE_SCOPE_LABELS, OFFICIAL_RECORD_STATUS_LABELS, OFFICIAL_RECORD_TYPE_LABELS } from '@/utils/labels'

function emptyForm(): OfficialRecordInput {
  return {
    title: '',
    number: '',
    record_date: new Date().toISOString().slice(0, 10),
    type: 'otro',
    description: '',
    document_url: null,
    status: 'vigente',
    audience: 'todos',
    course_id: null,
    student_id: null,
  }
}

export function OfficialRecordsPage() {
  const { showToast } = useToast()
  const confirm = useConfirm()

  const [page, setPage] = useState(1)
  const { data: courses } = useSimpleQuery(listActiveCourses, [], () =>
    showToast('error', 'No se pudieron cargar los cursos.'),
  )

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<OfficialRecord | null>(null)
  const [form, setForm] = useState<OfficialRecordInput>(emptyForm())
  const [pickedStudent, setPickedStudent] = useState<StudentWithCourse | null>(null)
  const [errors, setErrors] = useState<Partial<Record<keyof OfficialRecordInput, string>>>({})
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  const {
    data: records,
    count: total,
    loading,
    reload,
  } = useListQuery({ page, pageSize: DEFAULT_PAGE_SIZE }, listOfficialRecords, () =>
    showToast('error', 'No se pudieron cargar las actas.'),
  )

  function openCreate() {
    setEditing(null)
    setForm(emptyForm())
    setPickedStudent(null)
    setErrors({})
    setModalOpen(true)
  }

  function openEdit(record: OfficialRecord) {
    setEditing(record)
    setForm({
      title: record.title,
      number: record.number ?? '',
      record_date: record.record_date,
      type: record.type,
      description: record.description ?? '',
      document_url: record.document_url,
      status: record.status,
      audience: record.audience,
      course_id: record.course_id,
      student_id: record.student_id,
    })
    setPickedStudent(null)
    setErrors({})
    setModalOpen(true)
  }

  async function handleFileChange(file: File | undefined) {
    if (!file) return
    setUploading(true)
    try {
      const path = await uploadOfficialRecordDocument(file, form.student_id)
      setForm((f) => ({ ...f, document_url: path }))
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : 'No se pudo subir el documento.')
    } finally {
      setUploading(false)
    }
  }

  async function handleViewDocument(record: OfficialRecord) {
    if (!record.document_url) return
    try {
      const url = await getOfficialRecordSignedUrl(record.document_url)
      window.open(url, '_blank', 'noopener,noreferrer')
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : 'No se pudo abrir el documento.')
    }
  }

  function validate(): boolean {
    const next: Partial<Record<keyof OfficialRecordInput, string>> = {}
    if (!form.title.trim()) next.title = 'El título es obligatorio.'
    if (form.audience === 'curso' && !form.course_id) next.course_id = 'Selecciona un curso.'
    if (form.audience === 'estudiante' && !form.student_id) next.student_id = 'Selecciona un estudiante.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!validate()) return

    const payload: OfficialRecordInput = { ...form, number: form.number || null, description: form.description || null }

    setSaving(true)
    try {
      if (editing) {
        await updateOfficialRecord(editing.id, payload)
        showToast('success', 'Acta actualizada correctamente.')
      } else {
        await createOfficialRecord(payload)
        showToast('success', 'Acta creada correctamente.')
      }
      setModalOpen(false)
      reload()
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : 'No se pudo guardar el acta.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(record: OfficialRecord) {
    const confirmed = await confirm({
      title: `¿Eliminar el acta "${record.title}"?`,
      description: 'Esta acción no se puede deshacer.',
      confirmLabel: 'Eliminar',
      variant: 'danger',
    })
    if (!confirmed) return

    try {
      await deleteOfficialRecord(record.id)
      showToast('success', 'Acta eliminada correctamente.')
      reload()
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : 'No se pudo eliminar el acta.')
    }
  }

  const columns: TableColumn<OfficialRecord>[] = [
    { key: 'title', header: 'Título', render: (r) => <span className="font-medium text-neutral-900">{r.title}</span> },
    { key: 'type', header: 'Tipo', render: (r) => OFFICIAL_RECORD_TYPE_LABELS[r.type] },
    { key: 'date', header: 'Fecha', render: (r) => r.record_date },
    { key: 'audience', header: 'Audiencia', render: (r) => AUDIENCE_SCOPE_LABELS[r.audience] },
    {
      key: 'status',
      header: 'Estado',
      render: (r) => (
        <Badge variant={r.status === 'vigente' ? 'success' : 'neutral'}>
          {OFFICIAL_RECORD_STATUS_LABELS[r.status]}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (r) => (
        <RowActions
          actions={[
            ...(r.document_url
              ? [{ label: 'Ver documento', icon: <FileSignature className="h-4 w-4" />, onClick: () => void handleViewDocument(r) }]
              : []),
            { label: 'Editar', icon: <Pencil className="h-4 w-4" />, onClick: () => openEdit(r) },
            {
              label: 'Eliminar',
              icon: <Trash2 className="h-4 w-4" />,
              variant: 'danger' as const,
              onClick: () => void handleDelete(r),
            },
          ]}
        />
      ),
    },
  ]

  return (
    <div>
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Actas</h1>
          <p className="text-sm text-neutral-500">Actas institucionales y su documento asociado.</p>
        </div>
        <Button onClick={openCreate}>
          <FileSignature className="h-4 w-4" />
          Nueva acta
        </Button>
      </div>

      <Table
        columns={columns}
        data={records}
        keyField={(r) => r.id}
        loading={loading}
        emptyTitle="No hay actas registradas"
      />
      <Pagination page={page} pageSize={DEFAULT_PAGE_SIZE} total={total} onPageChange={setPage} />

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Editar acta' : 'Nueva acta'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Título"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              error={errors.title}
              className="sm:col-span-2"
            />
            <Input
              label="Número (opcional)"
              value={form.number ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, number: e.target.value }))}
            />
            <Select
              label="Tipo"
              value={form.type}
              onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as OfficialRecord['type'] }))}
            >
              {Constants.public.Enums.official_record_type.map((type) => (
                <option key={type} value={type}>
                  {OFFICIAL_RECORD_TYPE_LABELS[type]}
                </option>
              ))}
            </Select>
            <Input
              label="Fecha"
              type="date"
              value={form.record_date}
              onChange={(e) => setForm((f) => ({ ...f, record_date: e.target.value }))}
            />
            <Select
              label="Estado"
              value={form.status}
              onChange={(e) =>
                setForm((f) => ({ ...f, status: e.target.value as OfficialRecord['status'] }))
              }
            >
              {Constants.public.Enums.official_record_status.map((status) => (
                <option key={status} value={status}>
                  {OFFICIAL_RECORD_STATUS_LABELS[status]}
                </option>
              ))}
            </Select>
          </div>

          <Textarea
            label="Descripción (opcional)"
            value={form.description ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          />

          <div>
            <p className="mb-1.5 text-sm font-medium text-neutral-700">Documento (PDF, opcional)</p>
            <label htmlFor="acta-document">
              <span className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-neutral-300 px-3.5 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50">
                <Upload className="h-4 w-4" />
                {uploading ? 'Subiendo...' : form.document_url ? 'Reemplazar documento' : 'Subir documento'}
              </span>
              <input
                id="acta-document"
                type="file"
                accept="application/pdf"
                className="hidden"
                disabled={uploading}
                onChange={(e) => void handleFileChange(e.target.files?.[0])}
              />
            </label>
          </div>

          <AudienceFields
            audience={form.audience}
            onAudienceChange={(audience) =>
              setForm((f) => ({ ...f, audience, course_id: null, student_id: null }))
            }
            courses={courses}
            courseId={form.course_id}
            onCourseChange={(course_id) => setForm((f) => ({ ...f, course_id }))}
            student={pickedStudent}
            onStudentChange={(s) => {
              setPickedStudent(s)
              setForm((f) => ({ ...f, student_id: s?.id ?? null }))
            }}
          />
          {errors.course_id && <p className="text-sm text-danger-600">{errors.course_id}</p>}
          {errors.student_id && <p className="text-sm text-danger-600">{errors.student_id}</p>}

          <div className="flex justify-end gap-3 border-t border-neutral-200 pt-4">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" loading={saving}>
              {editing ? 'Guardar cambios' : 'Crear acta'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
