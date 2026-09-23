import { Award, BarChart3, GraduationCap, ListChecks, Percent } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Select } from '@/components/ui/Select'
import { Skeleton } from '@/components/ui/Skeleton'
import { useSimpleQuery } from '@/hooks/useSimpleQuery'
import { useToast } from '@/hooks/useToast'
import { listAcademicPeriods, listSubjects, periodLabel } from '@/services/academicCatalog.service'
import { courseLabel, listActiveCourses, type Course } from '@/services/courses.service'
import { listGradesForStats, type GradeStatRow } from '@/services/grades.service'
import {
  findPerformanceLevel,
  listPerformanceLevels,
  performanceLevelColor,
  type PerformanceLevel,
} from '@/services/performanceLevels.service'
import type { AcademicPeriod, Subject } from '@/services/academicCatalog.service'

interface AggregatedItem {
  id: string
  label: string
  average: number
  count: number
}

interface LevelAggregate {
  level: PerformanceLevel
  count: number
  percentage: number
}

interface GradeStats {
  total: number
  average: number
  bySubject: AggregatedItem[]
  byPeriod: AggregatedItem[]
  byLevel: LevelAggregate[]
  approvalRate: number
}

function computeStats(rows: GradeStatRow[], levels: PerformanceLevel[]): GradeStats {
  const total = rows.length
  const average = total ? rows.reduce((sum, r) => sum + r.score, 0) / total : 0

  const subjectMap = new Map<string, { label: string; sum: number; count: number }>()
  const periodMap = new Map<string, { label: string; sum: number; count: number; sortKey: string }>()
  const levelCounts = new Map<string, number>()

  for (const row of rows) {
    const subjectEntry = subjectMap.get(row.subject_id) ?? {
      label: row.subjects?.name ?? 'Sin asignatura',
      sum: 0,
      count: 0,
    }
    subjectEntry.sum += row.score
    subjectEntry.count += 1
    subjectMap.set(row.subject_id, subjectEntry)

    const periodEntry = periodMap.get(row.period_id) ?? {
      label: row.academic_periods ? periodLabel(row.academic_periods) : 'Sin período',
      sum: 0,
      count: 0,
      sortKey: `${row.academic_periods?.academic_year ?? ''}-${row.academic_periods?.name ?? ''}`,
    }
    periodEntry.sum += row.score
    periodEntry.count += 1
    periodMap.set(row.period_id, periodEntry)

    const level = findPerformanceLevel(row.score, levels)
    if (level) levelCounts.set(level.id, (levelCounts.get(level.id) ?? 0) + 1)
  }

  const bySubject = Array.from(subjectMap.entries())
    .map(([id, v]) => ({ id, label: v.label, average: v.sum / v.count, count: v.count }))
    .sort((a, b) => b.average - a.average)

  const byPeriod = Array.from(periodMap.entries())
    .map(([id, v]) => ({ id, label: v.label, average: v.sum / v.count, count: v.count, sortKey: v.sortKey }))
    .sort((a, b) => a.sortKey.localeCompare(b.sortKey))
    .map(({ id, label, average, count }) => ({ id, label, average, count }))

  const byLevel = levels.map((level) => {
    const count = levelCounts.get(level.id) ?? 0
    return { level, count, percentage: total ? (count / total) * 100 : 0 }
  })

  const lowestLevel = [...levels].sort((a, b) => a.min_score - b.min_score)[0]
  const lowCount = lowestLevel ? levelCounts.get(lowestLevel.id) ?? 0 : 0
  const approvalRate = total ? ((total - lowCount) / total) * 100 : 0

  return { total, average, bySubject, byPeriod, byLevel, approvalRate }
}

export function StatisticsPage() {
  const { showToast } = useToast()

  const { data: courses } = useSimpleQuery(listActiveCourses, [] as Course[], () =>
    showToast('error', 'No se pudieron cargar los cursos.'),
  )
  const { data: subjects } = useSimpleQuery(listSubjects, [] as Subject[], () =>
    showToast('error', 'No se pudieron cargar las asignaturas.'),
  )
  const { data: periods } = useSimpleQuery(listAcademicPeriods, [] as AcademicPeriod[], () =>
    showToast('error', 'No se pudieron cargar los períodos académicos.'),
  )
  const { data: levels } = useSimpleQuery(listPerformanceLevels, [] as PerformanceLevel[], () =>
    showToast('error', 'No se pudieron cargar los desempeños.'),
  )

  const [courseFilter, setCourseFilter] = useState('')
  const [subjectFilter, setSubjectFilter] = useState('')
  const [periodFilter, setPeriodFilter] = useState('')
  const filterKey = `${courseFilter}:${subjectFilter}:${periodFilter}`

  const [rows, setRows] = useState<GradeStatRow[]>([])
  const [loadedFilterKey, setLoadedFilterKey] = useState<string | null>(null)
  const loading = loadedFilterKey !== filterKey

  useEffect(() => {
    let active = true
    listGradesForStats({
      courseId: courseFilter || undefined,
      subjectId: subjectFilter || undefined,
      periodId: periodFilter || undefined,
    })
      .then((result) => {
        if (!active) return
        setRows(result)
        setLoadedFilterKey(filterKey)
      })
      .catch(() => {
        if (!active) return
        showToast('error', 'No se pudieron cargar las estadísticas.')
        setLoadedFilterKey(filterKey)
      })
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterKey])

  const stats = useMemo(() => computeStats(rows, levels), [rows, levels])

  const kpis = [
    { label: 'Calificaciones analizadas', value: stats.total.toLocaleString('es-CO'), icon: ListChecks },
    { label: 'Promedio general', value: stats.total ? stats.average.toFixed(1) : '—', icon: BarChart3 },
    {
      label: 'Tasa de aprobación',
      value: stats.total ? `${stats.approvalRate.toFixed(0)}%` : '—',
      icon: Percent,
    },
    {
      label: 'Mejor asignatura',
      value: stats.bySubject[0]?.label ?? '—',
      icon: GraduationCap,
      sub: stats.bySubject[0] ? `Promedio ${stats.bySubject[0].average.toFixed(1)}` : undefined,
    },
  ]

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900">Estadísticas académicas</h1>
        <p className="text-sm text-neutral-500">
          Panorama del rendimiento académico institucional por curso, asignatura y período.
        </p>
      </div>

      <div className="mb-6 flex flex-col gap-3 rounded-xl border border-neutral-200 bg-white p-4 sm:flex-row">
        <Select value={courseFilter} onChange={(e) => setCourseFilter(e.target.value)} className="sm:w-56">
          <option value="">Todos los cursos</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {courseLabel(c)} ({c.academic_year})
            </option>
          ))}
        </Select>
        <Select value={subjectFilter} onChange={(e) => setSubjectFilter(e.target.value)} className="sm:w-56">
          <option value="">Todas las asignaturas</option>
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </Select>
        <Select value={periodFilter} onChange={(e) => setPeriodFilter(e.target.value)} className="sm:w-56">
          <option value="">Todos los períodos</option>
          {periods.map((p) => (
            <option key={p.id} value={p.id}>
              {periodLabel(p)}
            </option>
          ))}
        </Select>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="flex items-center gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                <kpi.icon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-xl font-bold text-neutral-900" title={kpi.value}>
                  {kpi.value}
                </p>
                <p className="text-sm text-neutral-500">{kpi.label}</p>
                {kpi.sub && <p className="text-xs text-neutral-400">{kpi.sub}</p>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-4 w-4 text-brand-700" />
              Distribución por desempeño
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-40 w-full" />
            ) : stats.total === 0 ? (
              <EmptyState
                title="Sin calificaciones"
                description="No hay calificaciones registradas para estos filtros."
              />
            ) : (
              <DistributionDonut byLevel={stats.byLevel} total={stats.total} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-brand-700" />
              Promedio por asignatura
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-8 w-full" />
                ))}
              </div>
            ) : (
              <AverageBarList items={stats.bySubject} levels={levels} />
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-brand-700" />
              Promedio por período académico
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-8 w-full" />
                ))}
              </div>
            ) : (
              <AverageBarList items={stats.byPeriod} levels={levels} />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function buildConicStops(byLevel: LevelAggregate[]): string[] {
  const segments = byLevel.filter((l) => l.percentage > 0)
  const stops: string[] = []
  let cumulative = 0
  for (const segment of segments) {
    const color = performanceLevelColor(segment.level.slug).hex
    const start = cumulative
    cumulative += segment.percentage
    stops.push(`${color} ${start}% ${cumulative}%`)
  }
  return stops
}

function DistributionDonut({ byLevel, total }: { byLevel: LevelAggregate[]; total: number }) {
  const stops = buildConicStops(byLevel)
  const background = stops.length > 0 ? `conic-gradient(${stops.join(', ')})` : '#e2e8f0'

  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row">
      <div className="relative h-40 w-40 shrink-0 rounded-full" style={{ background }}>
        <div className="absolute inset-3 flex flex-col items-center justify-center rounded-full bg-white text-center">
          <span className="text-2xl font-bold text-neutral-900">{total}</span>
          <span className="text-xs text-neutral-500">calificaciones</span>
        </div>
      </div>
      <ul className="w-full flex-1 space-y-2.5">
        {byLevel.map((l) => {
          const color = performanceLevelColor(l.level.slug)
          return (
            <li key={l.level.id} className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-neutral-700">
                <span className={`h-2.5 w-2.5 rounded-full ${color.dot}`} aria-hidden />
                {l.level.name}
              </span>
              <span className="font-medium text-neutral-900">
                {l.count}{' '}
                <span className="font-normal text-neutral-400">({l.percentage.toFixed(0)}%)</span>
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function AverageBarList({ items, levels }: { items: AggregatedItem[]; levels: PerformanceLevel[] }) {
  if (items.length === 0) {
    return <EmptyState title="Sin datos" description="No hay calificaciones para estos filtros." />
  }

  const maxScore = Math.max(10, ...levels.map((l) => l.max_score))

  return (
    <ul className="space-y-4">
      {items.map((item) => {
        const level = findPerformanceLevel(item.average, levels)
        const color = performanceLevelColor(level?.slug ?? '')
        const widthPct = Math.min(100, Math.max(0, (item.average / maxScore) * 100))

        return (
          <li key={item.id}>
            <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
              <span className="truncate font-medium text-neutral-800">{item.label}</span>
              <span className="shrink-0 text-neutral-500">
                <span className="font-semibold text-neutral-900">{item.average.toFixed(1)}</span>
                {' · '}
                {item.count} {item.count === 1 ? 'nota' : 'notas'}
              </span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-neutral-100">
              <div
                className={`h-full rounded-full transition-all ${color.bar}`}
                style={{ width: `${widthPct}%` }}
              />
            </div>
          </li>
        )
      })}
    </ul>
  )
}
