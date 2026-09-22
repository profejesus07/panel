import { Megaphone, Pencil, Plus, Trash2, Upload } from 'lucide-react'
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
import {
  createAnnouncement,
  deleteAnnouncement,
  listAnnouncements,
  updateAnnouncement,
  uploadAnnouncementImage,
  type Announcement,
  type AnnouncementInput,
} from '@/services/announcements.service'
import { listActiveCourses } from '@/services/courses.service'
import type { StudentWithCourse } from '@/services/students.service'
import { Constants } from '@/types/database.types'
import { DEFAULT_PAGE_SIZE } from '@/types/common'
import { ANNOUNCEMENT_STATUS_LABELS, AUDIENCE_SCOPE_LABELS } from '@/utils/labels'

function toDateInput(iso: string | null): string {
  return iso ? iso.slice(0, 10) : ''
}

function emptyForm(): AnnouncementInput {
  return {
    title: '',
    content: '',
    image_url: null,
    publish_at: new Date().toISOString(),
    expires_at: null,
    status: 'publicado',
    audience: 'todos',
    course_id: null,
    student_id: null,
  }
}

const STATUS_BADGE_VARIANT: Record<Announcement['status'], 'neutral' | 'success' | 'brand'> = {
  borrador: 'neutral',
  publicado: 'success',
  archivado: 'brand',
}

export function AnnouncementsPage() {
  const { showToast } = useToast()
  const confirm = useConfirm()

  const [page, setPage] = useState(1)
  const { data: courses } = useSimpleQuery(listActiveCourses, [], () =>
    showToast('error', 'No se pudieron cargar los cursos.'),
  )

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Announcement | null>(null)
  const [form, setForm] = useState<AnnouncementInput>(emptyForm())
  const [pickedStudent, setPickedStudent] = useState<StudentWithCourse | null>(null)
  const [errors, setErrors] = useState<Partial<Record<keyof AnnouncementInput, string>>>({})
  const [saving, setSaving] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)

  const {
    data: announcements,
    count: total,
    loading,
    reload,
  } = useListQuery(
    { page, pageSize: DEFAULT_PAGE_SIZE },
    listAnnouncements,
    () => showToast('error', 'No se pudieron cargar los anuncios.'),
  )

  function openCreate() {
    setEditing(null)
    setForm(emptyForm())
    setPickedStudent(null)
    setErrors({})
    setModalOpen(true)
  }

  function openEdit(announcement: Announcement) {
    setEditing(announcement)
    setForm({
      title: announcement.title,
      content: announcement.content,
      image_url: announcement.image_url,
      publish_at: announcement.publish_at,
      expires_at: announcement.expires_at,
      status: announcement.status,
      audience: announcement.audience,
      course_id: announcement.course_id,
      student_id: announcement.student_id,
    })
    setPickedStudent(null)
    setErrors({})
    setModalOpen(true)
  }

  async function handleImageChange(file: File | undefined) {
    if (!file) return
    setUploadingImage(true)
    try {
      const url = await uploadAnnouncementImage(file)
      setForm((f) => ({ ...f, image_url: url }))
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : 'No se pudo subir la imagen.')
    } finally {
      setUploadingImage(false)
    }
  }

  function validate(): boolean {
    const next: Partial<Record<keyof AnnouncementInput, string>> = {}
    if (!form.title.trim()) next.title = 'El título es obligatorio.'
    if (!form.content.trim()) next.content = 'El contenido es obligatorio.'
    if (form.audience === 'curso' && !form.course_id) next.course_id = 'Selecciona un curso.'
    if (form.audience === 'estudiante' && !form.student_id) next.student_id = 'Selecciona un estudiante.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!validate()) return

    setSaving(true)
    try {
      if (editing) {
        await updateAnnouncement(editing.id, form)
        showToast('success', 'Anuncio actualizado correctamente.')
      } else {
        await createAnnouncement(form)
        showToast('success', 'Anuncio creado correctamente.')
      }
      setModalOpen(false)
      reload()
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : 'No se pudo guardar el anuncio.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(announcement: Announcement) {
    const confirmed = await confirm({
      title: `¿Eliminar el anuncio "${announcement.title}"?`,
      description: 'Esta acción no se puede deshacer.',
      confirmLabel: 'Eliminar',
      variant: 'danger',
    })
    if (!confirmed) return

    try {
      await deleteAnnouncement(announcement.id)
      showToast('success', 'Anuncio eliminado correctamente.')
      reload()
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : 'No se pudo eliminar el anuncio.')
    }
  }

  const columns: TableColumn<Announcement>[] = [
    { key: 'title', header: 'Título', render: (a) => <span className="font-medium text-neutral-900">{a.title}</span> },
    { key: 'audience', header: 'Audiencia', render: (a) => AUDIENCE_SCOPE_LABELS[a.audience] },
    {
      key: 'status',
      header: 'Estado',
      render: (a) => <Badge variant={STATUS_BADGE_VARIANT[a.status]}>{ANNOUNCEMENT_STATUS_LABELS[a.status]}</Badge>,
    },
    { key: 'publish_at', header: 'Publicación', render: (a) => toDateInput(a.publish_at) },
    { key: 'expires_at', header: 'Expira', render: (a) => (a.expires_at ? toDateInput(a.expires_at) : '—') },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (a) => (
        <RowActions
          actions={[
            { label: 'Editar', icon: <Pencil className="h-4 w-4" />, onClick: () => openEdit(a) },
            {
              label: 'Eliminar',
              icon: <Trash2 className="h-4 w-4" />,
              variant: 'danger',
              onClick: () => void handleDelete(a),
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
          <h1 className="text-2xl font-bold text-neutral-900">Anuncios</h1>
          <p className="text-sm text-neutral-500">Comunicados institucionales por audiencia.</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Nuevo anuncio
        </Button>
      </div>

      <Table
        columns={columns}
        data={announcements}
        keyField={(a) => a.id}
        loading={loading}
        emptyTitle="No hay anuncios"
        emptyDescription="Crea el primer anuncio institucional."
      />
      <Pagination page={page} pageSize={DEFAULT_PAGE_SIZE} total={total} onPageChange={setPage} />

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Editar anuncio' : 'Nuevo anuncio'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <Input
            label="Título"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            error={errors.title}
          />
          <Textarea
            label="Contenido"
            rows={4}
            value={form.content}
            onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
            error={errors.content}
          />

          <div>
            <p className="mb-1.5 text-sm font-medium text-neutral-700">Imagen (opcional)</p>
            <div className="flex items-center gap-3">
              {form.image_url && (
                <img src={form.image_url} alt="" className="h-14 w-14 rounded-lg object-cover" />
              )}
              <label htmlFor="announcement-image">
                <span className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-neutral-300 px-3.5 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50">
                  <Upload className="h-4 w-4" />
                  {uploadingImage ? 'Subiendo...' : form.image_url ? 'Cambiar imagen' : 'Subir imagen'}
                </span>
                <input
                  id="announcement-image"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  disabled={uploadingImage}
                  onChange={(e) => void handleImageChange(e.target.files?.[0])}
                />
              </label>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Fecha de publicación"
              type="date"
              value={toDateInput(form.publish_at)}
              onChange={(e) =>
                setForm((f) => ({ ...f, publish_at: new Date(e.target.value).toISOString() }))
              }
            />
            <Input
              label="Fecha de expiración (opcional)"
              type="date"
              value={toDateInput(form.expires_at)}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  expires_at: e.target.value ? new Date(e.target.value).toISOString() : null,
                }))
              }
            />
          </div>

          <Select
            label="Estado"
            value={form.status}
            onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as Announcement['status'] }))}
          >
            {Constants.public.Enums.announcement_status.map((status) => (
              <option key={status} value={status}>
                {ANNOUNCEMENT_STATUS_LABELS[status]}
              </option>
            ))}
          </Select>

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
              <Megaphone className="h-4 w-4" />
              {editing ? 'Guardar cambios' : 'Publicar anuncio'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
