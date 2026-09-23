import { clsx } from 'clsx'
import {
  BookOpen,
  Calculator,
  FileSpreadsheet,
  GraduationCap,
  ListChecks,
  MessageSquare,
  Pencil,
  Percent,
  Plus,
  Search,
  Trash2,
  UsersRound,
} from 'lucide-react'
import { type FormEvent, useCallback, useEffect, useMemo, useState } from 'react'
import { ExcelImportModal } from '@/components/admin/ExcelImportModal'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Select } from '@/components/ui/Select'
import { Table, type TableColumn } from '@/components/ui/Table'
import { Textarea } from '@/components/ui/Textarea'
import { useConfirm } from '@/hooks/useConfirm'
import { useSimpleQuery } from '@/hooks/useSimpleQuery'
import { useToast } from '@/hooks/useToast'
import { listAcademicPeriods, listSubjects, periodLabel } from '@/services/academicCatalog.service'
import { courseLabel, listActiveCourses } from '@/services/courses.service'
import {
  computeFinalGrade,
  deleteGradeEntry,
  formatScore,
  listGradeEntries,
  upsertConceptGradeEntry,
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
  createGradingConcept,
  deleteGradingConcept,
  gradingConceptsWeightTotal,
  listGradingConcepts,
  updateGradingConcept,
  type GradingConcept,
} from '@/services/gradingConcepts.service'
import {
  findPerformanceLevel,
  listPerformanceLevels,
  performanceLevelColor,
  type PerformanceLevel,
} from '@/services/performanceLevels.service'
import { listStudents, studentFullName, type StudentWithCourse } from '@/services/students.service'

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

function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

interface ConceptForm {
  name: string
  weight: string
  date: string
}

function emptyConceptForm(): ConceptForm {
  return { name: '', weight: '', date: todayISO() }
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

  const ready = Boolean(courseId && subjectId && periodId) && loadedStudentsFor === courseId

  // Actividades configuradas (conceptos) para el curso + asignatura + período.
  const [version, setVersion] = useState(0)
  const [concepts, setConcepts] = useState<GradingConcept[]>([])
  const [loadedConceptsKey, setLoadedConceptsKey] = useState<string | null>(null)
  const conceptsKey = `${courseId}:${subjectId}:${periodId}:${version}`
  const loadingConcepts = ready && loadedConceptsKey !== conceptsKey

  useEffect(() => {
    if (!ready) return
    let active = true
    listGradingConcepts({ courseId, subjectId, periodId })
      .then((rows) => {
        if (!active) return
        setConcepts(rows)
        setLoadedConceptsKey(conceptsKey)
      })
      .catch(() => {
        if (!active) return
        showToast('error', 'No se pudieron cargar las actividades del curso.')
        setLoadedConceptsKey(conceptsKey)
      })
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conceptsKey, ready])

  // Notas parciales y calificaciones consolidadas del curso.
  const [entries, setEntries] = useState<GradeEntry[]>([])
  const [grades, setGrades] = useState<Grade[]>([])
  const [loadedGradesKey, setLoadedGradesKey] = useState<string | null>(null)
  const gradesKey = conceptsKey
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

  function reload() {
    setVersion((v) => v + 1)
  }

  function selectCourse(id: string) {
    setCourseId(id)
    setStudentSearch('')
  }

  // ---------------------------------------------------------------------
  // Configuración de actividades (grading_concepts).
  // ---------------------------------------------------------------------
  const [conceptModalOpen, setConceptModalOpen] = useState(false)
  const [editingConcept, setEditingConcept] = useState<GradingConcept | null>(null)
  const [conceptForm, setConceptForm] = useState<ConceptForm>(emptyConceptForm())
  const [conceptErrors, setConceptErrors] = useState<Partial<Record<keyof ConceptForm, string>>>({})
  const [savingConcept, setSavingConcept] = useState(false)

  const conceptsWeightTotal = gradingConceptsWeightTotal(concepts)
  const otherConceptWeightTotal =
    conceptsWeightTotal - (editingConcept?.weight ?? 0)

  function openCreateConcept() {
    setEditingConcept(null)
    setConceptForm(emptyConceptForm())
    setConceptErrors({})
    setConceptModalOpen(true)
  }

  function openEditConcept(concept: GradingConcept) {
    setEditingConcept(concept)
    setConceptForm({
      name: concept.name,
      weight: concept.weight === null ? '' : String(concept.weight),
      date: concept.date,
    })
    setConceptErrors({})
    setConceptModalOpen(true)
  }

  function validateConcept(): boolean {
    const next: Partial<Record<keyof ConceptForm, string>> = {}
    const name = conceptForm.name.trim()
    const weight = conceptForm.weight.trim() ? Number(conceptForm.weight.replace(',', '.')) : null

    if (!name) next.name = 'Escribe el nombre de la actividad.'
    else if (concepts.some((c) => c.id !== editingConcept?.id && c.name.toLowerCase() === name.toLowerCase())) {
      next.name = 'Ya existe una actividad con ese nombre en este curso.'
    }
    if (weight !== null) {
      if (Number.isNaN(weight) || weight <= 0 || weight > 100) {
        next.weight = 'El porcentaje debe ser mayor que 0 y máximo 100.'
      } else if (otherConceptWeightTotal + weight > 100) {
        next.weight = `Con este porcentaje la suma sería ${otherConceptWeightTotal + weight} %. Máximo disponible: ${100 - otherConceptWeightTotal} %.`
      }
    }
    if (!conceptForm.date) next.date = 'La fecha es obligatoria.'
    setConceptErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleConceptSubmit(event: FormEvent) {
    event.preventDefault()
    if (!validateConcept()) return

    const payload = {
      course_id: courseId,
      subject_id: subjectId,
      period_id: periodId,
      name: conceptForm.name.trim(),
      weight: conceptForm.weight.trim() ? Number(conceptForm.weight.replace(',', '.')) : null,
      date: conceptForm.date,
    }

    setSavingConcept(true)
    try {
      if (editingConcept) {
        await updateGradingConcept(editingConcept.id, {
          name: payload.name,
          weight: payload.weight,
          date: payload.date,
        })
        showToast('success', 'Actividad actualizada correctamente.')
      } else {
        await createGradingConcept(payload)
        showToast('success', 'Actividad creada correctamente.')
      }
      setConceptModalOpen(false)
      reload()
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : 'No se pudo guardar la actividad.')
    } finally {
      setSavingConcept(false)
    }
  }

  async function handleDeleteConcept(concept: GradingConcept) {
    const confirmed = await confirm({
      title: '¿Eliminar esta actividad?',
      description: `Se eliminará "${concept.name}" del curso. Las notas que ya se hayan registrado con ella se conservan como notas libres, pero dejarán de mostrarse en esta cuadrícula.`,
      confirmLabel: 'Eliminar',
      variant: 'danger',
    })
    if (!confirmed) return

    try {
      await deleteGradingConcept(concept.id)
      showToast('success', 'Actividad eliminada correctamente.')
      reload()
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : 'No se pudo eliminar la actividad.')
    }
  }

  // ---------------------------------------------------------------------
  // Cuadrícula de notas: una celda editable por estudiante + actividad.
  // La nota se escribe directamente en la celda (sin ventana emergente); la
  // fecha la toma de la actividad. El modal solo se usa para la observación
  // opcional y para eliminar la nota.
  // ---------------------------------------------------------------------
  const saveScore = useCallback(
    async (result: StudentResult, concept: GradingConcept, score: number): Promise<void> => {
      const entry = result.entries.find((e) => e.concept_id === concept.id) ?? null
      try {
        await upsertConceptGradeEntry({
          id: entry?.id,
          studentId: result.student.id,
          subjectId,
          periodId,
          conceptId: concept.id,
          score,
          gradedAt: concept.date,
          observation: entry?.observation ?? null,
        })
        reload()
      } catch (error) {
        showToast('error', error instanceof Error ? error.message : 'No se pudo guardar la nota.')
        throw error
      }
    },
    [subjectId, periodId, showToast],
  )

  const [detailsTarget, setDetailsTarget] = useState<{ result: StudentResult; concept: GradingConcept } | null>(null)
  const [observationDraft, setObservationDraft] = useState('')
  const [savingDetails, setSavingDetails] = useState(false)

  const detailsEntry = detailsTarget
    ? (detailsTarget.result.entries.find((e) => e.concept_id === detailsTarget.concept.id) ?? null)
    : null

  function openDetails(result: StudentResult, concept: GradingConcept) {
    const entry = result.entries.find((e) => e.concept_id === concept.id) ?? null
    if (!entry) return
    setDetailsTarget({ result, concept })
    setObservationDraft(entry.observation ?? '')
  }

  async function submitDetails(event: FormEvent) {
    event.preventDefault()
    if (!detailsTarget || !detailsEntry) return

    setSavingDetails(true)
    try {
      await upsertConceptGradeEntry({
        id: detailsEntry.id,
        studentId: detailsTarget.result.student.id,
        subjectId,
        periodId,
        conceptId: detailsTarget.concept.id,
        score: detailsEntry.score,
        gradedAt: detailsEntry.graded_at,
        observation: observationDraft.trim() || null,
      })
      showToast('success', 'Observación guardada correctamente.')
      setDetailsTarget(null)
      reload()
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : 'No se pudo guardar la observación.')
    } finally {
      setSavingDetails(false)
    }
  }

  async function handleDeleteCellEntry() {
    if (!detailsEntry) return
    const confirmed = await confirm({
      title: '¿Eliminar esta nota?',
      description: `Se eliminará la nota de "${detailsTarget?.concept.name}" y se recalculará la nota final.`,
      confirmLabel: 'Eliminar',
      variant: 'danger',
    })
    if (!confirmed) return

    try {
      await deleteGradeEntry(detailsEntry.id)
      showToast('success', 'Nota eliminada correctamente.')
      setDetailsTarget(null)
      reload()
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : 'No se pudo eliminar la nota.')
    }
  }

  const [importOpen, setImportOpen] = useState(false)

  const gridColumns: TableColumn<StudentResult>[] = useMemo(() => {
    const studentColumn: TableColumn<StudentResult> = {
      key: 'student',
      header: 'Estudiante',
      render: (r) => (
        <div className="min-w-40">
          <p className="font-medium text-neutral-900">{studentFullName(r.student)}</p>
          <p className="text-xs text-neutral-400">{r.student.student_code}</p>
        </div>
      ),
    }
    const conceptColumns: TableColumn<StudentResult>[] = concepts.map((concept) => ({
      key: concept.id,
      header: concept.weight !== null ? `${concept.name} · ${formatScore(concept.weight)} %` : concept.name,
      className: 'text-center',
      render: (r) => {
        const entry = r.entries.find((e) => e.concept_id === concept.id) ?? null
        return (
          <GradeCell
            entry={entry}
            maxScore={maxScore}
            levels={performanceLevels}
            ariaLabel={`Nota de ${studentFullName(r.student)} en ${concept.name}`}
            onSave={(score) => saveScore(r, concept, score)}
            onInvalid={(message) => showToast('error', message)}
            onOpenDetails={entry ? () => openDetails(r, concept) : undefined}
          />
        )
      },
    }))
    const finalColumn: TableColumn<StudentResult> = {
      key: 'final',
      header: 'Nota final',
      className: 'text-center',
      render: (r) => {
        const score = resultScore(r)
        return (
          <div className="flex justify-center">
            {score !== null ? (
              <ScoreBadge score={score} levels={performanceLevels} />
            ) : (
              <span className="text-sm text-neutral-300">—</span>
            )}
          </div>
        )
      },
    }
    return [studentColumn, ...conceptColumns, finalColumn]
  }, [concepts, performanceLevels, maxScore, saveScore, showToast])

  const subjectName = subjects.find((s) => s.id === subjectId)?.name ?? ''
  const period = periods.find((p) => p.id === periodId)

  return (
    <div>
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Calificaciones</h1>
          <p className="text-sm text-neutral-500">
            Elige curso, asignatura y período; configura las actividades y registra la nota de cada estudiante.
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
          description="Selecciona el curso, la asignatura y el período para configurar las actividades y ver a los estudiantes."
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

          <Card className="mb-6">
            <CardContent>
              <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-brand-50 to-brand-100 text-brand-700 ring-1 ring-inset ring-brand-200/50">
                    <ListChecks className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-neutral-900">Actividades de {subjectName}</h2>
                    <p className="text-xs text-neutral-500">
                      {subjectName} · {period ? periodLabel(period) : ''} · Porcentaje configurado:{' '}
                      <span className={clsx('font-medium', conceptsWeightTotal > 100 ? 'text-danger-600' : 'text-neutral-700')}>
                        {formatScore(conceptsWeightTotal)} %
                      </span>
                    </p>
                  </div>
                </div>
                <Button size="sm" onClick={openCreateConcept}>
                  <Plus className="h-4 w-4" />
                  Nueva actividad
                </Button>
              </div>

              {loadingConcepts ? (
                <p className="text-sm text-neutral-400">Cargando actividades…</p>
              ) : concepts.length === 0 ? (
                <p className="text-sm text-neutral-500">
                  Aún no hay actividades configuradas para este curso, asignatura y período. Crea la primera (p. ej.
                  «Taller 1» o «Examen final») para empezar a registrar notas.
                </p>
              ) : (
                <ul className="flex flex-wrap gap-2">
                  {concepts.map((concept) => (
                    <li
                      key={concept.id}
                      className="group flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-50 py-1 pl-3 pr-1.5 text-sm"
                    >
                      <span className="font-medium text-neutral-800">{concept.name}</span>
                      {concept.weight !== null && (
                        <Badge variant="brand" className="tabular-nums">
                          {formatScore(concept.weight)} %
                        </Badge>
                      )}
                      <button
                        type="button"
                        onClick={() => openEditConcept(concept)}
                        aria-label={`Editar ${concept.name}`}
                        className="rounded-full p-1 text-neutral-400 hover:bg-white hover:text-neutral-600"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDeleteConcept(concept)}
                        aria-label={`Eliminar ${concept.name}`}
                        className="rounded-full p-1 text-neutral-400 hover:bg-white hover:text-danger-600"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {loadingConcepts ? null : concepts.length === 0 ? (
            <EmptyState
              icon={ListChecks}
              title="Configura la primera actividad"
              description="Crea al menos una actividad (taller, examen, exposición...) para poder registrar la nota de cada estudiante."
              action={
                <Button onClick={openCreateConcept}>
                  <Plus className="h-4 w-4" />
                  Nueva actividad
                </Button>
              }
            />
          ) : (
            <>
              <div className="relative mb-4 max-w-xs">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                <Input
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  placeholder="Buscar estudiante..."
                  className="pl-9"
                />
              </div>
              <Table
                columns={gridColumns}
                data={visibleResults}
                keyField={(r) => r.student.id}
                loading={loadingStudents || loadingGrades}
                emptyTitle={students.length === 0 ? 'Este curso no tiene estudiantes.' : 'Sin coincidencias.'}
              />
            </>
          )}
        </>
      )}

      {/* Modal: crear/editar actividad */}
      <Modal
        open={conceptModalOpen}
        onClose={() => setConceptModalOpen(false)}
        title={editingConcept ? 'Editar actividad' : 'Nueva actividad'}
        description={`${subjectName} · ${period ? periodLabel(period) : ''}`}
        size="sm"
      >
        <form onSubmit={handleConceptSubmit} className="space-y-4" noValidate>
          <Input
            label="Nombre de la actividad"
            placeholder="Ej.: Taller 1, Evaluación bimestral, Exposición"
            value={conceptForm.name}
            onChange={(e) => setConceptForm((f) => ({ ...f, name: e.target.value }))}
            error={conceptErrors.name}
          />
          <Input
            label="Porcentaje (opcional)"
            type="number"
            inputMode="decimal"
            step="1"
            min={1}
            max={100}
            placeholder="Sin porcentaje = promedio"
            value={conceptForm.weight}
            onChange={(e) => setConceptForm((f) => ({ ...f, weight: e.target.value }))}
            error={conceptErrors.weight}
            hint={
              conceptErrors.weight
                ? undefined
                : `Ya asignado en otras actividades: ${formatScore(otherConceptWeightTotal)} %. Disponible: ${formatScore(100 - otherConceptWeightTotal)} %.`
            }
          />
          <Input
            label="Fecha de la actividad"
            type="date"
            value={conceptForm.date}
            onChange={(e) => setConceptForm((f) => ({ ...f, date: e.target.value }))}
            error={conceptErrors.date}
            hint={conceptErrors.date ? undefined : 'Se usará como fecha de las notas que registres para esta actividad.'}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setConceptModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" loading={savingConcept}>
              {editingConcept ? 'Guardar cambios' : 'Crear actividad'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: observación de una nota ya registrada (la nota se edita directo en la celda) */}
      <Modal
        open={detailsTarget !== null}
        onClose={() => setDetailsTarget(null)}
        title={detailsTarget ? detailsTarget.concept.name : ''}
        description={detailsTarget ? studentFullName(detailsTarget.result.student) : undefined}
        size="sm"
      >
        {detailsTarget && detailsEntry && (
          <form onSubmit={submitDetails} className="space-y-4" noValidate>
            <div className="flex items-center gap-2 rounded-lg bg-neutral-50 px-3 py-2 text-xs text-neutral-500">
              <Percent className="h-3.5 w-3.5 shrink-0" />
              Nota: {formatScore(detailsEntry.score)} · {new Date(`${detailsEntry.graded_at}T00:00:00`).toLocaleDateString('es-CO')}
            </div>
            <Textarea
              label="Observación (opcional)"
              autoFocus
              value={observationDraft}
              onChange={(e) => setObservationDraft(e.target.value)}
            />
            <div className="flex items-center justify-between gap-3 pt-2">
              <Button type="button" variant="ghost" onClick={() => void handleDeleteCellEntry()}>
                <Trash2 className="h-4 w-4" />
                Eliminar nota
              </Button>
              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={() => setDetailsTarget(null)}>
                  Cancelar
                </Button>
                <Button type="submit" loading={savingDetails}>
                  Guardar
                </Button>
              </div>
            </div>
          </form>
        )}
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

interface GradeCellProps {
  entry: GradeEntry | null
  maxScore: number
  levels: PerformanceLevel[]
  ariaLabel: string
  onSave: (score: number) => Promise<void>
  onInvalid: (message: string) => void
  onOpenDetails?: () => void
}

// Celda editable de la cuadrícula: clic para escribir la nota directamente
// (sin ventana emergente), Enter o clic afuera para guardar. El detalle
// (observación, eliminar) queda en un botón secundario que abre un modal.
function GradeCell({ entry, maxScore, levels, ariaLabel, onSave, onInvalid, onOpenDetails }: GradeCellProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const [saving, setSaving] = useState(false)

  function startEditing() {
    setDraft(entry ? String(entry.score) : '')
    setEditing(true)
  }

  async function commit() {
    const raw = draft.trim()
    if (!raw) {
      setEditing(false)
      return
    }
    const score = Number(raw.replace(',', '.'))
    if (Number.isNaN(score) || score < 0 || score > maxScore) {
      onInvalid(`La nota debe estar entre 0 y ${maxScore}.`)
      setEditing(false)
      return
    }
    if (entry && score === entry.score) {
      setEditing(false)
      return
    }
    setSaving(true)
    try {
      await onSave(score)
    } catch {
      // El error ya se muestra con un toast en onSave.
    } finally {
      setSaving(false)
      setEditing(false)
    }
  }

  if (editing) {
    return (
      <div className="flex justify-center">
        <input
          type="number"
          inputMode="decimal"
          step="0.1"
          min={0}
          max={maxScore}
          autoFocus
          disabled={saving}
          aria-label={ariaLabel}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onFocus={(e) => e.currentTarget.select()}
          onBlur={() => void commit()}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              void commit()
            } else if (e.key === 'Escape') {
              setEditing(false)
            }
          }}
          className="h-7 w-14 rounded-md border border-brand-400 text-center text-sm tabular-nums outline-none ring-2 ring-brand-100"
        />
      </div>
    )
  }

  return (
    <div className="group flex items-center justify-center gap-1">
      <button type="button" onClick={startEditing} aria-label={ariaLabel} className="transition-transform hover:scale-105">
        {entry ? (
          <ScoreBadge score={entry.score} levels={levels} />
        ) : (
          <span className="flex h-7 w-11 items-center justify-center rounded-md border border-dashed border-neutral-300 text-neutral-300 transition-colors hover:border-brand-400 hover:text-brand-500">
            <Plus className="h-3.5 w-3.5" />
          </span>
        )}
      </button>
      {onOpenDetails && (
        <button
          type="button"
          onClick={onOpenDetails}
          aria-label="Ver observación de la nota"
          className={clsx(
            'rounded-full p-1 text-neutral-300 hover:bg-neutral-100 hover:text-neutral-600',
            entry?.observation ? 'text-brand-400' : 'opacity-0 group-hover:opacity-100',
          )}
        >
          <MessageSquare className="h-3 w-3" />
        </button>
      )}
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
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-brand-50 to-brand-100 text-brand-700 ring-1 ring-inset ring-brand-200/50">
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
