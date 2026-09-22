import { GraduationCap, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { type FormEvent, useState } from 'react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Pagination } from '@/components/ui/Pagination'
import { RowActions } from '@/components/ui/RowActions'
import { Select } from '@/components/ui/Select'
import { Table, type TableColumn } from '@/components/ui/Table'
import { useConfirm } from '@/hooks/useConfirm'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { useListQuery } from '@/hooks/useListQuery'
import { useToast } from '@/hooks/useToast'
import {
  createCourse,
  deleteCourse,
  listCourses,
  updateCourse,
  type Course,
  type CourseInput,
} from '@/services/courses.service'
import { Constants } from '@/types/database.types'
import { DEFAULT_PAGE_SIZE } from '@/types/common'
import { COURSE_SHIFT_LABELS, COURSE_STATUS_LABELS } from '@/utils/labels'

const EMPTY_FORM: CourseInput = {
  grade: '',
  group_name: '',
  shift: 'unica',
  academic_year: new Date().getFullYear().toString(),
  status: 'activo',
}

export function CoursesPage() {
  const { showToast } = useToast()
  const confirm = useConfirm()

  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search)
  const [statusFilter, setStatusFilter] = useState('')

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Course | null>(null)
  const [form, setForm] = useState<CourseInput>(EMPTY_FORM)
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof CourseInput, string>>>({})
  const [saving, setSaving] = useState(false)

  const {
    data: courses,
    count: total,
    loading,
    reload,
  } = useListQuery(
    {
      page,
      pageSize: DEFAULT_PAGE_SIZE,
      search: debouncedSearch || undefined,
      status: (statusFilter || undefined) as Course['status'] | undefined,
    },
    listCourses,
    () => showToast('error', 'No se pudieron cargar los cursos.'),
  )

  function handleSearchChange(value: string) {
    setSearch(value)
    setPage(1)
  }

  function handleStatusFilterChange(value: string) {
    setStatusFilter(value)
    setPage(1)
  }

  function openCreate() {
    setEditing(null)
    setForm(EMPTY_FORM)
    setFormErrors({})
    setModalOpen(true)
  }

  function openEdit(course: Course) {
    setEditing(course)
    setForm({
      grade: course.grade,
      group_name: course.group_name,
      shift: course.shift,
      academic_year: course.academic_year,
      status: course.status,
    })
    setFormErrors({})
    setModalOpen(true)
  }

  function validate(): boolean {
    const errors: Partial<Record<keyof CourseInput, string>> = {}
    if (!form.grade.trim()) errors.grade = 'El grado es obligatorio.'
    if (!form.group_name.trim()) errors.group_name = 'El grupo es obligatorio.'
    if (!form.academic_year.trim()) errors.academic_year = 'El año lectivo es obligatorio.'
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!validate()) return

    setSaving(true)
    try {
      if (editing) {
        await updateCourse(editing.id, form)
        showToast('success', 'Curso actualizado correctamente.')
      } else {
        await createCourse(form)
        showToast('success', 'Curso creado correctamente.')
      }
      setModalOpen(false)
      reload()
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : 'No se pudo guardar el curso.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(course: Course) {
    const confirmed = await confirm({
      title: `¿Eliminar el curso ${course.grade} - ${course.group_name}?`,
      description: 'Esta acción no se puede deshacer. No podrás eliminarlo si tiene asistencia registrada.',
      confirmLabel: 'Eliminar',
      variant: 'danger',
    })
    if (!confirmed) return

    try {
      await deleteCourse(course.id)
      showToast('success', 'Curso eliminado correctamente.')
      reload()
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : 'No se pudo eliminar el curso.')
    }
  }

  const columns: TableColumn<Course>[] = [
    { key: 'grade', header: 'Grado', render: (c) => <span className="font-medium text-neutral-900">{c.grade}</span> },
    { key: 'group_name', header: 'Grupo', render: (c) => c.group_name },
    { key: 'shift', header: 'Jornada', render: (c) => COURSE_SHIFT_LABELS[c.shift] },
    { key: 'academic_year', header: 'Año lectivo', render: (c) => c.academic_year },
    {
      key: 'status',
      header: 'Estado',
      render: (c) => (
        <Badge variant={c.status === 'activo' ? 'success' : 'neutral'}>
          {COURSE_STATUS_LABELS[c.status]}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (c) => (
        <RowActions
          actions={[
            { label: 'Editar', icon: <Pencil className="h-4 w-4" />, onClick: () => openEdit(c) },
            {
              label: 'Eliminar',
              icon: <Trash2 className="h-4 w-4" />,
              variant: 'danger',
              onClick: () => void handleDelete(c),
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
          <h1 className="text-2xl font-bold text-neutral-900">Cursos</h1>
          <p className="text-sm text-neutral-500">Grados, grupos y jornadas por año lectivo.</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Nuevo curso
        </Button>
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <Input
            placeholder="Buscar por grado o grupo..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select
          value={statusFilter}
          onChange={(e) => handleStatusFilterChange(e.target.value)}
          className="sm:w-48"
        >
          <option value="">Todos los estados</option>
          {Constants.public.Enums.course_status.map((status) => (
            <option key={status} value={status}>
              {COURSE_STATUS_LABELS[status]}
            </option>
          ))}
        </Select>
      </div>

      <Table
        columns={columns}
        data={courses}
        keyField={(c) => c.id}
        loading={loading}
        emptyTitle="No hay cursos registrados"
        emptyDescription="Crea el primer curso para poder asignar estudiantes."
      />
      <Pagination page={page} pageSize={DEFAULT_PAGE_SIZE} total={total} onPageChange={setPage} />

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Editar curso' : 'Nuevo curso'}
        size="sm"
      >
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <Input
            label="Grado"
            placeholder="Ej. 6°"
            value={form.grade}
            onChange={(e) => setForm((f) => ({ ...f, grade: e.target.value }))}
            error={formErrors.grade}
          />
          <Input
            label="Grupo"
            placeholder="Ej. A"
            value={form.group_name}
            onChange={(e) => setForm((f) => ({ ...f, group_name: e.target.value }))}
            error={formErrors.group_name}
          />
          <Select
            label="Jornada"
            value={form.shift}
            onChange={(e) => setForm((f) => ({ ...f, shift: e.target.value as Course['shift'] }))}
          >
            {Constants.public.Enums.course_shift.map((shift) => (
              <option key={shift} value={shift}>
                {COURSE_SHIFT_LABELS[shift]}
              </option>
            ))}
          </Select>
          <Input
            label="Año lectivo"
            value={form.academic_year}
            onChange={(e) => setForm((f) => ({ ...f, academic_year: e.target.value }))}
            error={formErrors.academic_year}
          />
          <Select
            label="Estado"
            value={form.status}
            onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as Course['status'] }))}
          >
            {Constants.public.Enums.course_status.map((status) => (
              <option key={status} value={status}>
                {COURSE_STATUS_LABELS[status]}
              </option>
            ))}
          </Select>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" loading={saving}>
              <GraduationCap className="h-4 w-4" />
              {editing ? 'Guardar cambios' : 'Crear curso'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
