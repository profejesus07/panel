import { FileText, Pencil, Plus, Trash2 } from 'lucide-react'
import { type FormEvent, useEffect, useState } from 'react'
import { StudentPicker } from '@/components/admin/StudentPicker'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { RowActions } from '@/components/ui/RowActions'
import { Select } from '@/components/ui/Select'
import { Table, type TableColumn } from '@/components/ui/Table'
import { Textarea } from '@/components/ui/Textarea'
import { useConfirm } from '@/hooks/useConfirm'
import { useSimpleQuery } from '@/hooks/useSimpleQuery'
import { useToast } from '@/hooks/useToast'
import { listAcademicPeriods, listSubjects, periodLabel } from '@/services/academicCatalog.service'
import {
  createGrade,
  deleteGrade,
  listGradesForStudent,
  updateGrade,
  type Grade,
  type GradeInput,
  type GradeWithRefs,
} from '@/services/grades.service'
import type { StudentWithCourse } from '@/services/students.service'
import { Constants } from '@/types/database.types'
import { GRADE_STATUS_LABELS } from '@/utils/labels'

function emptyForm(): GradeInput {
  return {
    student_id: '',
    subject_id: '',
    period_id: '',
    score: 0,
    scale: '1.0 a 5.0',
    observation: '',
    graded_at: new Date().toISOString().slice(0, 10),
    status: 'definitiva',
  }
}

export function GradesPage() {
  const { showToast } = useToast()
  const confirm = useConfirm()

  const [student, setStudent] = useState<StudentWithCourse | null>(null)
  const [gradesVersion, setGradesVersion] = useState(0)
  const [grades, setGrades] = useState<GradeWithRefs[]>([])
  const [loadedGradesKey, setLoadedGradesKey] = useState<string | null>(null)
  const gradesKey = `${student?.id ?? ''}:${gradesVersion}`
  const loadingGrades = Boolean(student) && loadedGradesKey !== gradesKey

  const { data: subjects } = useSimpleQuery(listSubjects, [], () =>
    showToast('error', 'No se pudieron cargar las asignaturas.'),
  )
  const { data: periods } = useSimpleQuery(listAcademicPeriods, [], () =>
    showToast('error', 'No se pudieron cargar los períodos académicos.'),
  )

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Grade | null>(null)
  const [form, setForm] = useState<GradeInput>(emptyForm())
  const [errors, setErrors] = useState<Partial<Record<keyof GradeInput, string>>>({})
  const [saving, setSaving] = useState(false)

  function reloadGrades() {
    setGradesVersion((v) => v + 1)
  }

  useEffect(() => {
    if (!student) return

    let active = true
    listGradesForStudent(student.id)
      .then((result) => {
        if (!active) return
        setGrades(result)
        setLoadedGradesKey(gradesKey)
      })
      .catch(() => {
        if (!active) return
        showToast('error', 'No se pudieron cargar las calificaciones.')
        setLoadedGradesKey(gradesKey)
      })

    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gradesKey])

  function openCreate() {
    if (!student) return
    setEditing(null)
    setForm({ ...emptyForm(), student_id: student.id })
    setErrors({})
    setModalOpen(true)
  }

  function openEdit(grade: GradeWithRefs) {
    setEditing(grade)
    setForm({
      student_id: grade.student_id,
      subject_id: grade.subject_id,
      period_id: grade.period_id,
      score: grade.score,
      scale: grade.scale,
      observation: grade.observation ?? '',
      graded_at: grade.graded_at,
      status: grade.status,
    })
    setErrors({})
    setModalOpen(true)
  }

  function validate(): boolean {
    const next: Partial<Record<keyof GradeInput, string>> = {}
    if (!form.subject_id) next.subject_id = 'Selecciona una asignatura.'
    if (!form.period_id) next.period_id = 'Selecciona un período.'
    if (form.score < 0) next.score = 'La calificación no puede ser negativa.'
    if (!form.graded_at) next.graded_at = 'La fecha es obligatoria.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!validate() || !student) return

    setSaving(true)
    try {
      if (editing) {
        await updateGrade(editing.id, form)
        showToast('success', 'Calificación actualizada correctamente.')
      } else {
        await createGrade(form)
        showToast('success', 'Calificación registrada correctamente.')
      }
      setModalOpen(false)
      reloadGrades()
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : 'No se pudo guardar la calificación.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(grade: GradeWithRefs) {
    const confirmed = await confirm({
      title: '¿Eliminar esta calificación?',
      description: 'Esta acción no se puede deshacer.',
      confirmLabel: 'Eliminar',
      variant: 'danger',
    })
    if (!confirmed || !student) return

    try {
      await deleteGrade(grade.id)
      showToast('success', 'Calificación eliminada correctamente.')
      reloadGrades()
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : 'No se pudo eliminar la calificación.')
    }
  }

  const columns: TableColumn<GradeWithRefs>[] = [
    { key: 'subject', header: 'Asignatura', render: (g) => g.subjects?.name ?? '—' },
    {
      key: 'period',
      header: 'Período',
      render: (g) => (g.academic_periods ? periodLabel(g.academic_periods) : '—'),
    },
    {
      key: 'score',
      header: 'Calificación',
      render: (g) => (
        <span className="font-semibold text-neutral-900">
          {g.score} <span className="font-normal text-neutral-400">/ {g.scale}</span>
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Estado',
      render: (g) => (
        <Badge variant={g.status === 'definitiva' ? 'success' : 'neutral'}>
          {GRADE_STATUS_LABELS[g.status]}
        </Badge>
      ),
    },
    { key: 'date', header: 'Fecha', render: (g) => g.graded_at },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (g) => (
        <RowActions
          actions={[
            { label: 'Editar', icon: <Pencil className="h-4 w-4" />, onClick: () => openEdit(g) },
            {
              label: 'Eliminar',
              icon: <Trash2 className="h-4 w-4" />,
              variant: 'danger',
              onClick: () => void handleDelete(g),
            },
          ]}
        />
      ),
    },
  ]

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900">Calificaciones</h1>
        <p className="text-sm text-neutral-500">
          Consulta y registra las calificaciones de un estudiante por asignatura y período.
        </p>
      </div>

      <div className="mb-6 max-w-md">
        <StudentPicker value={student} onChange={setStudent} />
      </div>

      {!student ? (
        <EmptyState
          icon={FileText}
          title="Selecciona un estudiante"
          description="Busca un estudiante arriba para ver o registrar sus calificaciones."
        />
      ) : (
        <>
          <div className="mb-4 flex justify-end">
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4" />
              Nueva calificación
            </Button>
          </div>
          <Table
            columns={columns}
            data={grades}
            keyField={(g) => g.id}
            loading={loadingGrades}
            emptyTitle="Sin calificaciones registradas"
            emptyDescription="Registra la primera calificación de este estudiante."
          />
        </>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Editar calificación' : 'Nueva calificación'}
        size="sm"
      >
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <Select
            label="Asignatura"
            value={form.subject_id}
            onChange={(e) => setForm((f) => ({ ...f, subject_id: e.target.value }))}
            error={errors.subject_id}
          >
            <option value="">Selecciona una asignatura</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
          <Select
            label="Período académico"
            value={form.period_id}
            onChange={(e) => setForm((f) => ({ ...f, period_id: e.target.value }))}
            error={errors.period_id}
          >
            <option value="">Selecciona un período</option>
            {periods.map((p) => (
              <option key={p.id} value={p.id}>
                {periodLabel(p)}
              </option>
            ))}
          </Select>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Calificación"
              type="number"
              step="0.1"
              value={form.score}
              onChange={(e) => setForm((f) => ({ ...f, score: Number(e.target.value) }))}
              error={errors.score}
            />
            <Input
              label="Escala"
              value={form.scale}
              onChange={(e) => setForm((f) => ({ ...f, scale: e.target.value }))}
            />
          </div>
          <Input
            label="Fecha"
            type="date"
            value={form.graded_at}
            onChange={(e) => setForm((f) => ({ ...f, graded_at: e.target.value }))}
            error={errors.graded_at}
          />
          <Select
            label="Estado"
            value={form.status}
            onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as Grade['status'] }))}
          >
            {Constants.public.Enums.grade_status.map((status) => (
              <option key={status} value={status}>
                {GRADE_STATUS_LABELS[status]}
              </option>
            ))}
          </Select>
          <Textarea
            label="Observación"
            value={form.observation ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, observation: e.target.value }))}
          />

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" loading={saving}>
              {editing ? 'Guardar cambios' : 'Registrar calificación'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
