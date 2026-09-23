import { clsx } from 'clsx'
import { ChevronDown, FileText } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/Badge'
import { Card, CardContent } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import {
  computeFinalGrade,
  formatScore,
  listGradeEntriesForStudent,
  type GradeEntry,
} from '@/services/gradeEntries.service'
import { listGradesForStudent, type GradeWithRefs } from '@/services/grades.service'
import {
  findPerformanceLevel,
  listPerformanceLevels,
  performanceLevelColor,
  type PerformanceLevel,
} from '@/services/performanceLevels.service'
import { useToast } from '@/hooks/useToast'

interface LoadedData {
  grades: GradeWithRefs[]
  entries: GradeEntry[]
  levels: PerformanceLevel[]
}

export function GradesView({ studentId }: { studentId: string }) {
  const { showToast } = useToast()
  const [data, setData] = useState<LoadedData>({ grades: [], entries: [], levels: [] })
  const [loadedFor, setLoadedFor] = useState<string | null>(null)
  const loading = loadedFor !== studentId

  useEffect(() => {
    let active = true
    Promise.all([
      listGradesForStudent(studentId),
      listGradeEntriesForStudent(studentId),
      // La escala solo colorea las notas: si falla, se muestran sin color.
      listPerformanceLevels().catch(() => [] as PerformanceLevel[]),
    ])
      .then(([grades, entries, levels]) => {
        if (!active) return
        setData({ grades, entries, levels })
        setLoadedFor(studentId)
      })
      .catch(() => {
        if (!active) return
        showToast('error', 'No se pudieron cargar las calificaciones.')
        setLoadedFor(studentId)
      })
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId])

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    )
  }

  if (data.grades.length === 0) {
    return (
      <EmptyState
        icon={FileText}
        title="Sin calificaciones"
        description="Todavía no hay calificaciones registradas."
      />
    )
  }

  const byPeriod = new Map<string, GradeWithRefs[]>()
  for (const grade of data.grades) {
    const key = grade.academic_periods
      ? `${grade.academic_periods.name} (${grade.academic_periods.academic_year})`
      : 'Sin período'
    byPeriod.set(key, [...(byPeriod.get(key) ?? []), grade])
  }

  return (
    <div className="space-y-6">
      {Array.from(byPeriod.entries()).map(([period, periodGrades]) => (
        <Card key={period}>
          <CardContent>
            <h3 className="mb-1 text-sm font-semibold text-neutral-900">{period}</h3>
            <p className="mb-3 text-xs text-neutral-500">Toca una asignatura para ver el detalle de sus notas.</p>
            <ul className="divide-y divide-neutral-100">
              {periodGrades
                .slice()
                .sort((a, b) => (a.subjects?.name ?? '').localeCompare(b.subjects?.name ?? ''))
                .map((grade) => (
                  <SubjectRow
                    key={grade.id}
                    grade={grade}
                    entries={data.entries.filter(
                      (e) => e.subject_id === grade.subject_id && e.period_id === grade.period_id,
                    )}
                    levels={data.levels}
                  />
                ))}
            </ul>
          </CardContent>
        </Card>
      ))}
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

function SubjectRow({
  grade,
  entries,
  levels,
}: {
  grade: GradeWithRefs
  entries: GradeEntry[]
  levels: PerformanceLevel[]
}) {
  const [open, setOpen] = useState(false)
  const level = findPerformanceLevel(grade.score, levels)
  const final = computeFinalGrade(entries)
  const hasDetail = entries.length > 0 || Boolean(grade.observation)

  let methodText = ''
  if (final?.method === 'promedio') methodText = 'Nota final: promedio de todas las notas.'
  else if (final?.method === 'ponderado') methodText = 'Nota final: promedio según el porcentaje de cada nota.'
  else if (final?.method === 'mixto')
    methodText = 'Nota final: las notas sin porcentaje se reparten el porcentaje restante.'

  return (
    <li>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={!hasDetail}
        aria-expanded={open}
        className="flex w-full items-center gap-3 py-3 text-left disabled:cursor-default"
      >
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-neutral-900">{grade.subjects?.name ?? '—'}</p>
          <p className="text-xs text-neutral-500">
            {entries.length > 0
              ? `${entries.length} ${entries.length === 1 ? 'nota' : 'notas'}`
              : 'Nota final'}
            {level ? ` · Desempeño ${level.name.toLowerCase()}` : ''}
          </p>
        </div>
        <ScoreBadge score={grade.score} levels={levels} />
        <ChevronDown
          className={clsx(
            'h-4 w-4 shrink-0 text-neutral-400 transition-transform',
            open && 'rotate-180',
            !hasDetail && 'invisible',
          )}
        />
      </button>

      {open && (
        <div className="mb-3 rounded-lg bg-neutral-50 p-3">
          {entries.length > 0 && (
            <ul className="space-y-2">
              {entries.map((entry) => (
                <li
                  key={entry.id}
                  className="flex items-start justify-between gap-3 rounded-md bg-white p-3 shadow-sm ring-1 ring-neutral-200"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-neutral-900">{entry.concept}</p>
                    <p className="text-xs text-neutral-500">
                      {new Date(`${entry.graded_at}T00:00:00`).toLocaleDateString('es-CO')}
                      {' · '}
                      {entry.weight !== null
                        ? `Vale ${formatScore(entry.weight)} %`
                        : final?.unweightedShare
                          ? `Vale ${formatScore(final.unweightedShare)} %`
                          : 'Sin porcentaje'}
                    </p>
                    {entry.observation && (
                      <p className="mt-1.5 text-sm text-neutral-600">{entry.observation}</p>
                    )}
                  </div>
                  <ScoreBadge score={entry.score} levels={levels} />
                </li>
              ))}
            </ul>
          )}
          {methodText && <p className="mt-2 text-xs text-neutral-500">{methodText}</p>}
          {grade.observation && (
            <p className={clsx('text-sm text-neutral-600', entries.length > 0 && 'mt-2')}>
              <span className="font-medium text-neutral-800">Observación general: </span>
              {grade.observation}
            </p>
          )}
        </div>
      )}
    </li>
  )
}
