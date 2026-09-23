import { clsx } from 'clsx'
import {
  BookOpen,
  Calculator,
  FileSpreadsheet,
  GraduationCap,
  Pencil,
  Plus,
  Search,
  Trash2,
  UsersRound,
} from 'lucide-react'
import { type FormEvent, useEffect, useMemo, useState } from 'react'
import { ExcelImportModal } from '@/components/admin/ExcelImportModal'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { RowActions } from '@/components/ui/RowActions'
import { Select } from '@/components/ui/Select'
import { Skeleton } from '@/components/ui/Skeleton'
import { Table, type TableColumn } from '@/components/ui/Table'
import { Textarea } from '@/components/ui/Textarea'
import { useConfirm } from '@/hooks/useConfirm'
import { useSimpleQuery } from '@/hooks/useSimpleQuery'
import { useToast } from '@/hooks/useToast'
import { listAcademicPeriods, listSubjects, periodLabel } from '@/services/academicCatalog.service'
import { courseLabel, listActiveCourses } from '@/services/courses.service'
import {
  computeFinalGrade,
  createGradeEntry,
  deleteGradeEntry,
  formatScore,
  listGradeEntries,
  updateGradeEntry,
  type FinalGrade,
  type GradeEntry,
} from '@/services/gradeEntries.service'
import { listGradesForGroup, type Grade } from '@/services/grades.service'
import {
  bulkImportGrades,
  createGradeRowParser,
  GRADE_IMPORT_EXAMPLE,
  GRADE_IMPORT_HEADERS,
  GRADE_IMPORT_INSTRUCTIONS,
} from '@/services/gradesImport.service'
import {
  findPerformanceLevel,
  listPerformanceLevels,
  performanceLevelColor,
  type PerformanceLevel,
} from '@/services/performanceLevels.service'
import { listStudents, studentFullName, type StudentWithCourse } from '@/services/students.service'

interface EntryForm {
  concept: string
  score: string
  weight: string
  graded_at: string
  observation: string
}

function emptyEntryForm(): EntryForm {
  return {
    concept: '',
    score: '',
    weight: '',
    graded_at: new Date().toISOString().slice(0, 10),
    observation: '',
  }
}

const METHOD_LABELS: Record<FinalGrade['method'], string> = {
  promedio: 'Promedio simple',
  ponderado: 'Promedio ponderado',
  mixto: 'Ponderado + promedio',
}

interface StudentResult {
  student: StudentWithCourse
  entries: GradeEntry[]
  final: FinalGrade | null
  // Calificación consolidada sin notas parciales (p. ej. importada de Excel).
  importedScore: number | null
}

function resultScore(result: StudentResult): number | null {
  return result.final?.score ?? result.importedScore
}

export function GradesPage() {
  const { showToast } = useToast()
  const confirm = useConfirm()

  const { data: courses, loading: loadingCourses } = useSimpleQuery(listActiveCourses, [], () =>
    showToast('error', 'No se pudieron cargar los cursos.'),
  )
  const { data: subjects } = useSimpleQuery(listSubjects, [], () =>
    showToast('error', 'No se pudieron cargar las asignaturas.'),
  )
  const { data: periods } = useSimpleQuery(listAcademicPeriods, [], () =>
    showToast('error', 'No se pudieron cargar los períodos académicos.'),
  )
  const { data: performanceLevels } = useSimpleQuery(listPerformanceLevels, [] as PerformanceLevel[], () =>
    showToast('error', 'No se pudieron cargar los desempeños.'),
  )

  const [courseId, setCourseId] = useState('')
  const [subjectId, setSubjectId] = useState('')
  const [chosenPeriodId, setChosenPeriodId] = useState<string | null>(null)
  // Por defecto el primer período activo (el más reciente).
  const periodId = chosenPeriodId ?? periods.find((p) => p.status === 'activo')?.id ?? ''
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null)
  const [studentSearch, setStudentSearch] = useState('')

  // Estudiantes del curso.
  const [students, setStudents] = useState<StudentWithCourse[]>([])
  const [loadedStudentsFor, setLoadedStudentsFor] = useState<string | null>(null)
  const loadingStudents = Boolean(courseId) && loadedStudentsFor !== courseId

  useEffect(() => {
    if (!courseId) return
    let active = true
    listStudents({ courseId, pageSize: 1000 })
      .then((result) => {
        if (!active) return
        setStudents(result.data)
        setLoadedStudentsFor(courseId)
      })
      .catch(() => {
        if (!active) return
        showToast('error', 'No se pudieron cargar los estudiantes del curso.')
        setStudents([])
        setLoadedStudentsFor(courseId)
      })
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId])

  // Notas parciales y calificaciones consolidadas del curso.
  const [version, setVersion] = useState(0)
  const [entries, setEntries] = useState<GradeEntry[]>([])
  const [grades, setGrades] = useState<Grade[]>([])
  const [loadedGradesKey, setLoadedGradesKey] = useState<string | null>(null)
  const ready = Boolean(courseId && subjectId && periodId) && loadedStudentsFor === courseId
  const gradesKey = `${courseId}:${subjectId}:${periodId}:${version}`
  const loadingGrades = ready && loadedGradesKey !== gradesKey

  useEffect(() => {
    if (!ready) return
    let active = true
    const studentIds = students.map((s) => s.id)
    Promise.all([
      listGradeEntries({ studentIds, subjectId, periodId }),
      listGradesForGroup(studentIds, subjectId, periodId),
    ])
      .then(([entryRows, gradeRows]) => {
        if (!active) return
        setEntries(entryRows)
        setGrades(gradeRows)
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
  }, [gradesKey, ready])

  const results = useMemo<StudentResult[]>(() => {
    return students.map((student) => {
      const own = entries.filter((e) => e.student_id === student.id)
      const consolidated = grades.find((g) => g.student_id === student.id)
      return {
        student,
        entries: own,
        final: computeFinalGrade(own),
        importedScore: own.length === 0 && consolidated ? consolidated.score : null,
      }
    })
  }, [students, entries, grades])

  const visibleResults = useMemo(() => {
    const term = studentSearch.trim().toLowerCase()
    if (!term) return results
    return results.filter((r) => studentFullName(r.student).toLowerCase().includes(term))
  }, [results, studentSearch])

  const selected = results.find((r) => r.student.id === selectedStudentId) ?? null

  const courseStats = useMemo(() => {
    const scores = results.map(resultScore).filter((s): s is number => s !== null)
    const average = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : null
    const lowest = performanceLevels.length
      ? [...performanceLevels].sort((a, b) => a.min_score - b.min_score)[0]
      : null
    const failing = lowest
      ? scores.filter((s) => findPerformanceLevel(s, performanceLevels)?.id === lowest.id).length
      : 0
    return { graded: scores.length, average, failing, lowestName: lowest?.name ?? '' }
  }, [results, performanceLevels])

  const maxScore = performanceLevels.length ? Math.max(...performanceLevels.map((l) => l.max_score)) : 5

  // Formulario de nota parcial.
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<GradeEntry | null>(null)
  const [form, setForm] = useState<EntryForm>(emptyEntryForm())
  const [errors, setErrors] = useState<Partial<Record<keyof EntryForm, string>>>({})
  const [saving, setSaving] = useState(false)
  const [importOpen, setImportOpen] = useState(false)

  function reload() {
    setVersion((v) => v + 1)
  }

  function selectCourse(id: string) {
    setCourseId(id)
    setSelectedStudentId(null)
    setStudentSearch('')
  }

  function openCreate() {
    setEditing(null)
    setForm(emptyEntryForm())
    setErrors({})
    setModalOpen(true)
  }

  function openEdit(entry: GradeEntry) {
    setEditing(entry)
    setForm({
      concept: entry.concept,
      score: String(entry.score),
      weight: entry.weight === null ? '' : String(entry.weight),
      graded_at: entry.graded_at,
      observation: entry.observation ?? '',
    })
    setErrors({})
    setModalOpen(true)
  }

  const otherWeightTotal = selected
    ? selected.entries
        .filter((e) => e.id !== editing?.id)
        .reduce((sum, e) => sum + (e.weight ?? 0), 0)
    : 0

  function validate(): boolean {
    const next: Partial<Record<keyof EntryForm, string>> = {}
    const score = Number(form.score.replace(',', '.'))
    const weight = form.weight.trim() ? Number(form.weight.replace(',', '.')) : null

    if (!form.concept.trim()) next.concept = 'Escribe el concepto de la nota.'
    if (!form.score.trim() || Number.isNaN(score)) next.score = 'Ingresa la nota.'
    else if (score < 0 || score > maxScore) next.score = `La nota debe estar entre 0 y ${maxScore}.`
    if (weight !== null) {
      if (Number.isNaN(weight) || weight <= 0 || weight > 100) {
        next.weight = 'El porcentaje debe ser mayor que 0 y máximo 100.'
      } else if (otherWeightTotal + weight > 100) {
        next.weight = `Con este porcentaje la suma sería ${otherWeightTotal + weight} %. Máximo disponible: ${100 - otherWeightTotal} %.`
      }
    }
    if (!form.graded_at) next.graded_at = 'La fecha es obligatoria.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!selected || !validate()) return

    const payload = {
      concept: form.concept.trim(),
      score: Number(form.score.replace(',', '.')),
      weight: form.weight.trim() ? Number(form.weight.replace(',', '.')) : null,
      graded_at: form.graded_at,
      observation: form.observation.trim() || null,
    }

    setSaving(true)
    try {
      if (editing) {
        await updateGradeEntry(editing.id, payload)
        showToast('success', 'Nota actualizada correctamente.')
      } else {
        await createGradeEntry({
          ...payload,
          student_id: selected.student.id,
          subject_id: subjectId,
          period_id: periodId,
        })
        showToast('success', 'Nota registrada correctamente.')
      }
      setModalOpen(false)
      reload()
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : 'No se pudo guardar la nota.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(entry: GradeEntry) {
    const confirmed = await confirm({
      title: '¿Eliminar esta nota?',
      description: `Se eliminará "${entry.concept}" y se recalculará la nota final.`,
      confirmLabel: 'Eliminar',
      variant: 'danger',
    })
    if (!confirmed) return

    try {
      await deleteGradeEntry(entry.id)
      showToast('success', 'Nota eliminada correctamente.')
      reload()
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : 'No se pudo eliminar la nota.')
    }
  }

  const subjectName = subjects.find((s) => s.id === subjectId)?.name ?? ''
  const period = periods.find((p) => p.id === periodId)

  const entryColumns: TableColumn<GradeEntry>[] = [
    {
      key: 'concept',
      header: 'Concepto',
      render: (e) => (
        <div className="min-w-40">
          <p className="font-medium text-neutral-900">{e.concept}</p>
          {e.observation && <p className="mt-0.5 text-xs text-neutral-500">{e.observation}</p>}
        </div>
      ),
    },
    {
      key: 'score',
      header: 'Nota',
      render: (e) => <ScoreBadge score={e.score} levels={performanceLevels} />,
    },
    {
      key: 'weight',
      header: 'Porcentaje',
      render: (e) =>
        e.weight !== null ? (
          <span className="font-medium text-neutral-800">{formatScore(e.weight)} %</span>
        ) : (
          <span className="text-neutral-400">
            {selected?.final?.unweightedShare != null
              ? `Auto (${formatScore(selected.final.unweightedShare)} %)`
              : 'Promedio'}
          </span>
        ),
    },
    { key: 'date', header: 'Fecha', render: (e) => e.graded_at },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (e) => (
        <RowActions
          actions={[
            { label: 'Editar', icon: <Pencil className="h-4 w-4" />, onClick: () => openEdit(e) },
            {
              label: 'Eliminar',
              icon: <Trash2 className="h-4 w-4" />,
              variant: 'danger',
              onClick: () => void handleDelete(e),
            },
          ]}
        />
      ),
    },
  ]

  return (
    <div>
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Calificaciones</h1>
          <p className="text-sm text-neutral-500">
            Elige curso, asignatura y período; luego registra las notas de cada estudiante.
          </p>
        </div>
        <Button variant="outline" onClick={() => setImportOpen(true)}>
          <FileSpreadsheet className="h-4 w-4" />
          Importar Excel
        </Button>
      </div>

      <Card className="mb-6">
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Select
            label="1. Curso"
            value={courseId}
            onChange={(e) => selectCourse(e.target.value)}
            disabled={loadingCourses}
          >
            <option value="">Selecciona un curso</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {courseLabel(c)} · {c.academic_year}
              </option>
            ))}
          </Select>
          <Select label="2. Asignatura" value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
            <option value="">Selecciona una asignatura</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
          <Select label="3. Período" value={periodId} onChange={(e) => setChosenPeriodId(e.target.value)}>
            <option value="">Selecciona un período</option>
            {periods.map((p) => (
              <option key={p.id} value={p.id}>
                {periodLabel(p)}
              </option>
            ))}
          </Select>
        </CardContent>
      </Card>

      {!courseId || !subjectId || !periodId ? (
        <EmptyState
          icon={GraduationCap}
          title="Elige qué vas a calificar"
          description="Selecciona el curso, la asignatura y el período para ver a los estudiantes y sus notas."
        />
      ) : (
        <>
          <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatTile icon={UsersRound} label="Estudiantes" value={loadingStudents ? '…' : String(students.length)} />
            <StatTile icon={BookOpen} label="Con nota final" value={loadingGrades ? '…' : String(courseStats.graded)} />
            <StatTile
              icon={Calculator}
              label="Promedio del curso"
              value={loadingGrades ? '…' : courseStats.average !== null ? formatScore(courseStats.average) : '—'}
            />
            <StatTile
              icon={GraduationCap}
              label={courseStats.lowestName ? `En desempeño ${courseStats.lowestName.toLowerCase()}` : 'En riesgo'}
              value={loadingGrades ? '…' : String(courseStats.failing)}
            />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]">
            <Card>
              <CardContent className="p-0">
                <div className="border-b border-neutral-200 p-3">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                    <Input
                      value={studentSearch}
                      onChange={(e) => setStudentSearch(e.target.value)}
                      placeholder="Buscar estudiante..."
                      className="pl-9"
                    />
                  </div>
                </div>
                {loadingStudents || loadingGrades ? (
                  <div className="space-y-2 p-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : visibleResults.length === 0 ? (
                  <p className="p-6 text-center text-sm text-neutral-500">
                    {students.length === 0 ? 'Este curso no tiene estudiantes.' : 'Sin coincidencias.'}
                  </p>
                ) : (
                  <ul className="max-h-[32rem] divide-y divide-neutral-100 overflow-y-auto">
                    {visibleResults.map((r) => {
                      const score = resultScore(r)
                      const isSelected = r.student.id === selectedStudentId
                      return (
                        <li key={r.student.id}>
                          <button
                            type="button"
                            onClick={() => setSelectedStudentId(r.student.id)}
                            className={clsx(
                              'flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors',
                              isSelected ? 'bg-brand-50' : 'hover:bg-neutral-50',
                            )}
                          >
                            <div className="min-w-0">
                              <p
                                className={clsx(
                                  'truncate text-sm font-medium',
                                  isSelected ? 'text-brand-800' : 'text-neutral-900',
                                )}
                              >
                                {studentFullName(r.student)}
                              </p>
                              <p className="text-xs text-neutral-500">
                                {r.entries.length === 0
                                  ? r.importedScore !== null
                                    ? 'Nota importada'
                                    : 'Sin notas'
                                  : `${r.entries.length} ${r.entries.length === 1 ? 'nota' : 'notas'}`}
                              </p>
                            </div>
                            {score !== null ? (
                              <ScoreBadge score={score} levels={performanceLevels} />
                            ) : (
                              <span className="text-xs text-neutral-400">—</span>
                            )}
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </CardContent>
            </Card>

            <div>
              {!selected ? (
                <EmptyState
                  icon={UsersRound}
                  title="Selecciona un estudiante"
                  description="Elige un estudiante de la lista para ver y registrar sus notas."
                />
              ) : (
                <div className="space-y-4">
                  <FinalGradeCard
                    result={selected}
                    subjectName={subjectName}
                    periodName={period ? periodLabel(period) : ''}
                    levels={performanceLevels}
                    onAdd={openCreate}
                  />
                  <Table
                    columns={entryColumns}
                    data={selected.entries}
                    keyField={(e) => e.id}
                    emptyTitle="Sin notas registradas"
                    emptyDescription={
                      selected.importedScore !== null
                        ? 'Este estudiante tiene una nota final importada. Si agregas notas, la final se recalculará con ellas.'
                        : 'Agrega la primera nota de este estudiante en la asignatura.'
                    }
                  />
                </div>
              )}
            </div>
          </div>
        </>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Editar nota' : 'Nueva nota'}
        description={selected ? `${studentFullName(selected.student)} · ${subjectName}` : undefined}
      >
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <Input
            label="Concepto"
            placeholder="Ej.: Taller 1, Evaluación bimestral, Exposición"
            value={form.concept}
            onChange={(e) => setForm((f) => ({ ...f, concept: e.target.value }))}
            error={errors.concept}
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input
              label={`Nota (0 a ${maxScore})`}
              type="number"
              inputMode="decimal"
              step="0.1"
              min={0}
              max={maxScore}
              value={form.score}
              onChange={(e) => setForm((f) => ({ ...f, score: e.target.value }))}
              error={errors.score}
            />
            <Input
              label="Porcentaje (opcional)"
              type="number"
              inputMode="decimal"
              step="1"
              min={1}
              max={100}
              placeholder="Sin porcentaje = promedio"
              value={form.weight}
              onChange={(e) => setForm((f) => ({ ...f, weight: e.target.value }))}
              error={errors.weight}
              hint={
                errors.weight
                  ? undefined
                  : `Ya asignado en otras notas: ${otherWeightTotal} %. Disponible: ${100 - otherWeightTotal} %.`
              }
            />
          </div>
          <Input
            label="Fecha"
            type="date"
            value={form.graded_at}
            onChange={(e) => setForm((f) => ({ ...f, graded_at: e.target.value }))}
            error={errors.graded_at}
          />
          <Textarea
            label="Observación (opcional)"
            value={form.observation}
            onChange={(e) => setForm((f) => ({ ...f, observation: e.target.value }))}
          />

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" loading={saving}>
              {editing ? 'Guardar cambios' : 'Registrar nota'}
            </Button>
          </div>
        </form>
      </Modal>

      <ExcelImportModal
        open={importOpen}
        onClose={() => {
          setImportOpen(false)
          reload()
        }}
        title="Importar calificaciones desde Excel"
        description="Registra notas finales para varios estudiantes a la vez a partir de un archivo .xlsx."
        templateFilename="plantilla-calificaciones.xlsx"
        templateHeaders={GRADE_IMPORT_HEADERS}
        templateExample={GRADE_IMPORT_EXAMPLE}
        instructions={GRADE_IMPORT_INSTRUCTIONS}
        parseRow={createGradeRowParser(subjects, periods)}
        onImport={bulkImportGrades}
      />
    </div>
  )
}

function ScoreBadge({ score, levels }: { score: number; levels: PerformanceLevel[] }) {
  const level = findPerformanceLevel(score, levels)
  const color = performanceLevelColor(level?.slug ?? '')
  return (
    <Badge variant={color.badge} className="shrink-0 tabular-nums">
      {formatScore(score)}
    </Badge>
  )
}

function StatTile({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof BookOpen
  label: string
  value: string
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-xl font-bold text-neutral-900">{value}</p>
          <p className="truncate text-xs text-neutral-500">{label}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function FinalGradeCard({
  result,
  subjectName,
  periodName,
  levels,
  onAdd,
}: {
  result: StudentResult
  subjectName: string
  periodName: string
  levels: PerformanceLevel[]
  onAdd: () => void
}) {
  const score = resultScore(result)
  const level = score !== null ? findPerformanceLevel(score, levels) : null
  const color = performanceLevelColor(level?.slug ?? '')
  const final = result.final

  let explanation = 'Aún no hay notas registradas.'
  if (final?.method === 'promedio') {
    explanation = `Promedio simple de ${result.entries.length} ${result.entries.length === 1 ? 'nota' : 'notas'} (ninguna tiene porcentaje).`
  } else if (final?.method === 'ponderado') {
    explanation =
      final.weightTotal === 100
        ? 'Promedio ponderado según el porcentaje de cada nota.'
        : `Promedio ponderado. Los porcentajes suman ${formatScore(final.weightTotal)} %, así que se ajustan proporcionalmente.`
  } else if (final?.method === 'mixto') {
    explanation =
      final.unweightedShare && final.unweightedShare > 0
        ? `Las notas sin porcentaje se reparten el ${formatScore(100 - final.weightTotal)} % restante (${formatScore(final.unweightedShare)} % cada una).`
        : 'Los porcentajes ya suman 100 %, así que las notas sin porcentaje no cuentan.'
  } else if (result.importedScore !== null) {
    explanation = 'Nota final importada desde Excel, sin notas parciales.'
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
            {subjectName} · {periodName}
          </p>
          <h2 className="mt-0.5 truncate text-lg font-bold text-neutral-900">
            {studentFullName(result.student)}
          </h2>
          <p className="mt-1 text-sm text-neutral-500">{explanation}</p>
        </div>
        <div className="flex shrink-0 items-center gap-4">
          <div className="text-right">
            <p className="text-xs text-neutral-500">
              Nota final{final ? ` · ${METHOD_LABELS[final.method]}` : ''}
            </p>
            <p className="text-3xl font-bold tabular-nums text-neutral-900">
              {score !== null ? formatScore(score) : '—'}
            </p>
            {level && <Badge variant={color.badge}>{level.name}</Badge>}
          </div>
          <Button onClick={onAdd}>
            <Plus className="h-4 w-4" />
            Nueva nota
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
