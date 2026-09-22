import { FileText } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import { listGradesForStudent, type GradeWithRefs } from '@/services/grades.service'
import { useToast } from '@/hooks/useToast'

export function GradesView({ studentId }: { studentId: string }) {
  const { showToast } = useToast()
  const [grades, setGrades] = useState<GradeWithRefs[]>([])
  const [loadedFor, setLoadedFor] = useState<string | null>(null)
  const loading = loadedFor !== studentId

  useEffect(() => {
    let active = true
    listGradesForStudent(studentId)
      .then((result) => {
        if (!active) return
        setGrades(result)
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

  if (grades.length === 0) {
    return (
      <EmptyState
        icon={FileText}
        title="Sin calificaciones"
        description="Todavía no hay calificaciones registradas."
      />
    )
  }

  const byPeriod = new Map<string, GradeWithRefs[]>()
  for (const grade of grades) {
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
            <h3 className="mb-3 text-sm font-semibold text-neutral-900">{period}</h3>
            <div className="overflow-x-auto">
              <table className="w-full min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-neutral-200 text-xs uppercase text-neutral-500">
                    <th className="py-2 pr-4">Asignatura</th>
                    <th className="py-2 pr-4">Calificación</th>
                    <th className="py-2">Observación</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {periodGrades.map((grade) => (
                    <tr key={grade.id}>
                      <td className="py-2.5 pr-4 text-neutral-900">{grade.subjects?.name ?? '—'}</td>
                      <td className="py-2.5 pr-4 font-semibold text-neutral-900">
                        {grade.score} <span className="font-normal text-neutral-400">/ {grade.scale}</span>
                      </td>
                      <td className="py-2.5 text-neutral-600">{grade.observation ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
