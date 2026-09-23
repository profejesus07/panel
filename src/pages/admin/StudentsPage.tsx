import { FileSpreadsheet, KeyRound, Pencil, Plus, Search, Trash2, UserRound } from 'lucide-react'
import { type FormEvent, useEffect, useState } from 'react'
import { CreateAccessModal } from '@/components/admin/CreateAccessModal'
import { ExcelImportModal } from '@/components/admin/ExcelImportModal'
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
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { useListQuery } from '@/hooks/useListQuery'
import { useToast } from '@/hooks/useToast'
import { courseLabel, listActiveCourses, type Course } from '@/services/courses.service'
import {
  createStudent,
  deleteStudent,
  listStudents,
  studentFullName,
  updateStudent,
  type Student,
  type StudentInput,
  type StudentWithCourse,
} from '@/services/students.service'
import {
  bulkImportStudents,
  createStudentRowParser,
  STUDENT_IMPORT_EXAMPLE,
  STUDENT_IMPORT_HEADERS,
  STUDENT_IMPORT_INSTRUCTIONS,
  type StudentImportCredential,
} from '@/services/studentsImport.service'
import { Constants } from '@/types/database.types'
import { DEFAULT_PAGE_SIZE } from '@/types/common'
import { downloadExcelData } from '@/utils/excel'
import { DOCUMENT_TYPE_LABELS, formatDocument, STUDENT_STATUS_LABELS } from '@/utils/labels'
import { isValidEmail } from '@/utils/validation'

const EMPTY_FORM: StudentInput = {
  first_name: '',
  last_name: '',
  document_type: null,
  document_number: '',
  birth_date: '',
  gender: null,
  address: '',
  phone: '',
  email: '',
  student_code: '',
  status: 'activo',
  course_id: null,
  enrollment_date: new Date().toISOString().slice(0, 10),
  notes: '',
}

function toFormState(student: Student): StudentInput {
  return {
    first_name: student.first_name,
    last_name: student.last_name,
    document_type: student.document_type,
    document_number: student.document_number ?? '',
    birth_date: student.birth_date ?? '',
    gender: student.gender,
    address: student.address ?? '',
    phone: student.phone ?? '',
    email: student.email ?? '',
    student_code: student.student_code,
    status: student.status,
    course_id: student.course_id,
    enrollment_date: student.enrollment_date,
    notes: student.notes ?? '',
  }
}

export function StudentsPage() {
  const { showToast } = useToast()
  const confirm = useConfirm()

  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search)
  const [statusFilter, setStatusFilter] = useState('')
  const [courseFilter, setCourseFilter] = useState('')
  const [courses, setCourses] = useState<Course[]>([])

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Student | null>(null)
  const [form, setForm] = useState<StudentInput>(EMPTY_FORM)
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof StudentInput, string>>>({})
  const [saving, setSaving] = useState(false)
  const [accessTarget, setAccessTarget] = useState<StudentWithCourse | null>(null)
  const [importOpen, setImportOpen] = useState(false)
  const [importCredentials, setImportCredentials] = useState<StudentImportCredential[]>([])

  const {
    data: students,
    count: total,
    loading,
    reload,
  } = useListQuery(
    {
      page,
      pageSize: DEFAULT_PAGE_SIZE,
      search: debouncedSearch || undefined,
      status: (statusFilter || undefined) as Student['status'] | undefined,
      courseId: courseFilter || undefined,
    },
    listStudents,
    () => showToast('error', 'No se pudieron cargar los estudiantes.'),
  )

  useEffect(() => {
    listActiveCourses()
      .then(setCourses)
      .catch(() => showToast('error', 'No se pudieron cargar los cursos disponibles.'))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleSearchChange(value: string) {
    setSearch(value)
    setPage(1)
  }

  function handleStatusFilterChange(value: string) {
    setStatusFilter(value)
    setPage(1)
  }

  function handleCourseFilterChange(value: string) {
    setCourseFilter(value)
    setPage(1)
  }

  function openCreate() {
    setEditing(null)
    setForm(EMPTY_FORM)
    setFormErrors({})
    setModalOpen(true)
  }

  function openEdit(student: StudentWithCourse) {
    setEditing(student)
    setForm(toFormState(student))
    setFormErrors({})
    setModalOpen(true)
  }

  function validate(): boolean {
    const errors: Partial<Record<keyof StudentInput, string>> = {}
    if (!form.first_name.trim()) errors.first_name = 'Los nombres son obligatorios.'
    if (!form.last_name.trim()) errors.last_name = 'Los apellidos son obligatorios.'
    if (form.birth_date && new Date(form.birth_date) > new Date()) errors.birth_date = 'La fecha no puede ser futura.'
    if (!form.student_code.trim()) errors.student_code = 'El código estudiantil es obligatorio.'
    if (!form.enrollment_date) errors.enrollment_date = 'La fecha de ingreso es obligatoria.'
    if (form.email && !isValidEmail(form.email)) errors.email = 'Ingresa un correo válido.'

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!validate()) return

    const payload: StudentInput = {
      ...form,
      document_number: form.document_number?.trim() || null,
      birth_date: form.birth_date || null,
      gender: form.gender || null,
      address: form.address || null,
      phone: form.phone || null,
      email: form.email || null,
      course_id: form.course_id || null,
      notes: form.notes || null,
    }

    setSaving(true)
    try {
      if (editing) {
        await updateStudent(editing.id, payload)
        showToast('success', 'Estudiante actualizado correctamente.')
      } else {
        await createStudent(payload)
        showToast('success', 'Estudiante creado correctamente.')
      }
      setModalOpen(false)
      reload()
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : 'No se pudo guardar el estudiante.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(student: StudentWithCourse) {
    const confirmed = await confirm({
      title: `¿Eliminar a ${studentFullName(student)}?`,
      description:
        'Esta acción no se puede deshacer. Se eliminará junto con sus calificaciones, asistencia y demás registros asociados.',
      confirmLabel: 'Eliminar',
      variant: 'danger',
    })
    if (!confirmed) return

    try {
      await deleteStudent(student.id)
      showToast('success', 'Estudiante eliminado correctamente.')
      reload()
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : 'No se pudo eliminar el estudiante.')
    }
  }

  const columns: TableColumn<StudentWithCourse>[] = [
    {
      key: 'name',
      header: 'Estudiante',
      render: (s) => (
        <div>
          <p className="font-medium text-neutral-900">{studentFullName(s)}</p>
          <p className="text-xs text-neutral-500">{s.student_code}</p>
        </div>
      ),
    },
    {
      key: 'document',
      header: 'Documento',
      render: (s) =>
        s.document_number ? (
          <span>{formatDocument(s.document_type, s.document_number)}</span>
        ) : (
          <span className="text-neutral-400">Sin documento</span>
        ),
    },
    {
      key: 'course',
      header: 'Curso',
      render: (s) => (s.courses ? courseLabel(s.courses) : <span className="text-neutral-400">Sin asignar</span>),
    },
    {
      key: 'status',
      header: 'Estado',
      render: (s) => (
        <Badge variant={s.status === 'activo' ? 'success' : 'neutral'}>
          {STUDENT_STATUS_LABELS[s.status]}
        </Badge>
      ),
    },
    {
      key: 'access',
      header: 'Acceso',
      render: (s) =>
        s.user_id ? (
          <Badge variant="brand">Con acceso</Badge>
        ) : (
          <Badge variant="neutral">Sin acceso</Badge>
        ),
    },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (s) => (
        <RowActions
          actions={[
            ...(s.user_id
              ? []
              : [
                  {
                    label: 'Crear acceso',
                    icon: <KeyRound className="h-4 w-4" />,
                    onClick: () => setAccessTarget(s),
                  },
                ]),
            { label: 'Editar', icon: <Pencil className="h-4 w-4" />, onClick: () => openEdit(s) },
            {
              label: 'Eliminar',
              icon: <Trash2 className="h-4 w-4" />,
              variant: 'danger' as const,
              onClick: () => void handleDelete(s),
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
          <h1 className="text-2xl font-bold text-neutral-900">Estudiantes</h1>
          <p className="text-sm text-neutral-500">Matrícula y datos de los estudiantes.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setImportOpen(true)}>
            <FileSpreadsheet className="h-4 w-4" />
            Importar Excel
          </Button>
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Nuevo estudiante
          </Button>
        </div>
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <Input
            placeholder="Buscar por nombre, documento o código..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select
          value={courseFilter}
          onChange={(e) => handleCourseFilterChange(e.target.value)}
          className="sm:w-48"
        >
          <option value="">Todos los cursos</option>
          {courses.map((course) => (
            <option key={course.id} value={course.id}>
              {courseLabel(course)} ({course.academic_year})
            </option>
          ))}
        </Select>
        <Select
          value={statusFilter}
          onChange={(e) => handleStatusFilterChange(e.target.value)}
          className="sm:w-48"
        >
          <option value="">Todos los estados</option>
          {Constants.public.Enums.student_status.map((status) => (
            <option key={status} value={status}>
              {STUDENT_STATUS_LABELS[status]}
            </option>
          ))}
        </Select>
      </div>

      <Table
        columns={columns}
        data={students}
        keyField={(s) => s.id}
        loading={loading}
        emptyTitle="No hay estudiantes registrados"
        emptyDescription="Crea el primer estudiante para empezar a gestionar su información académica."
      />
      <Pagination page={page} pageSize={DEFAULT_PAGE_SIZE} total={total} onPageChange={setPage} />

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Editar estudiante' : 'Nuevo estudiante'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          <div>
            <h3 className="mb-3 text-sm font-semibold text-neutral-900">Datos personales</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Nombres"
                value={form.first_name}
                onChange={(e) => setForm((f) => ({ ...f, first_name: e.target.value }))}
                error={formErrors.first_name}
              />
              <Input
                label="Apellidos"
                value={form.last_name}
                onChange={(e) => setForm((f) => ({ ...f, last_name: e.target.value }))}
                error={formErrors.last_name}
              />
              <Select
                label="Tipo de documento (opcional)"
                value={form.document_type ?? ''}
                onChange={(e) =>
                  setForm((f) => ({ ...f, document_type: (e.target.value || null) as Student['document_type'] }))
                }
              >
                <option value="">Sin especificar</option>
                {Constants.public.Enums.document_type.map((type) => (
                  <option key={type} value={type}>
                    {DOCUMENT_TYPE_LABELS[type]}
                  </option>
                ))}
              </Select>
              <Input
                label="Número de documento (opcional)"
                value={form.document_number ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, document_number: e.target.value }))}
                error={formErrors.document_number}
              />
              <Input
                label="Fecha de nacimiento (opcional)"
                type="date"
                value={form.birth_date ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, birth_date: e.target.value }))}
                error={formErrors.birth_date}
              />
              <Select
                label="Género"
                value={form.gender ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, gender: e.target.value || null }))}
              >
                <option value="">Prefiere no decir</option>
                <option value="masculino">Masculino</option>
                <option value="femenino">Femenino</option>
                <option value="otro">Otro</option>
              </Select>
            </div>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold text-neutral-900">Matrícula</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Código estudiantil"
                value={form.student_code}
                onChange={(e) => setForm((f) => ({ ...f, student_code: e.target.value }))}
                error={formErrors.student_code}
              />
              <Select
                label="Curso"
                value={form.course_id ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, course_id: e.target.value || null }))}
              >
                <option value="">Sin asignar</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {courseLabel(course)} ({course.academic_year})
                  </option>
                ))}
              </Select>
              <Select
                label="Estado"
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as Student['status'] }))}
              >
                {Constants.public.Enums.student_status.map((status) => (
                  <option key={status} value={status}>
                    {STUDENT_STATUS_LABELS[status]}
                  </option>
                ))}
              </Select>
              <Input
                label="Fecha de ingreso"
                type="date"
                value={form.enrollment_date}
                onChange={(e) => setForm((f) => ({ ...f, enrollment_date: e.target.value }))}
                error={formErrors.enrollment_date}
              />
            </div>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold text-neutral-900">Contacto</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Dirección"
                value={form.address ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
              />
              <Input
                label="Teléfono"
                value={form.phone ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              />
              <Input
                label="Correo"
                type="email"
                value={form.email ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                error={formErrors.email}
                className="sm:col-span-2"
              />
            </div>
          </div>

          <Textarea
            label="Información adicional"
            value={form.notes ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            placeholder="Observaciones generales, condiciones médicas relevantes, etc."
          />

          <div className="flex justify-end gap-3 border-t border-neutral-200 pt-4">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" loading={saving}>
              <UserRound className="h-4 w-4" />
              {editing ? 'Guardar cambios' : 'Crear estudiante'}
            </Button>
          </div>
        </form>
      </Modal>

      {accessTarget && (
        <CreateAccessModal
          open
          onClose={() => setAccessTarget(null)}
          role="estudiante"
          linkId={accessTarget.id}
          defaultFullName={studentFullName(accessTarget)}
          username={accessTarget.student_code}
          onCreated={reload}
        />
      )}

      <ExcelImportModal
        open={importOpen}
        onClose={() => {
          setImportOpen(false)
          setImportCredentials([])
          reload()
        }}
        title="Importar estudiantes desde Excel"
        description="Crea varios estudiantes a la vez a partir de un archivo .xlsx."
        templateFilename="plantilla-estudiantes.xlsx"
        templateHeaders={STUDENT_IMPORT_HEADERS}
        templateExample={STUDENT_IMPORT_EXAMPLE}
        instructions={STUDENT_IMPORT_INSTRUCTIONS}
        parseRow={createStudentRowParser(courses)}
        onImport={(rows) => bulkImportStudents(rows, (cred) => setImportCredentials((prev) => [...prev, cred]))}
        renderDone={() =>
          importCredentials.length > 0 && (
            <div className="rounded-lg border border-brand-200 bg-brand-50 p-4">
              <p className="mb-2 text-sm font-medium text-brand-800">
                Se crearon {importCredentials.length} cuenta(s) de acceso. Descarga las credenciales
                para compartirlas de forma segura con cada familia — no se volverán a mostrar.
              </p>
              <Button
                size="sm"
                onClick={() =>
                  downloadExcelData(
                    'credenciales-estudiantes.xlsx',
                    ['Nombre', 'Usuario', 'Contraseña'],
                    importCredentials.map((c) => ({
                      Nombre: c.fullName,
                      Usuario: c.username,
                      Contraseña: c.password,
                    })),
                  )
                }
              >
                <FileSpreadsheet className="h-4 w-4" />
                Descargar credenciales
              </Button>
            </div>
          )
        }
      />
    </div>
  )
}
