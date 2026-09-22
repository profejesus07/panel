import { FileBarChart, Printer } from 'lucide-react'
import { useEffect, useState } from 'react'
import { ChildGate } from '@/components/portal/ChildGate'
import { ReportCardPreview } from '@/components/shared/ReportCardPreview'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Select } from '@/components/ui/Select'
import { Skeleton } from '@/components/ui/Skeleton'
import { useSimpleQuery } from '@/hooks/useSimpleQuery'
import { useToast } from '@/hooks/useToast'
import { listAcademicPeriods, periodLabel, type AcademicPeriod } from '@/services/academicCatalog.service'
import { getStudentReport, type StudentReportData } from '@/services/reports.service'
import type { StudentWithCourse } from '@/services/students.service'

export function ReportCardsPage() {
  return (
    <div>
      <div className="mb-6 print:hidden">
        <h1 className="text-2xl font-bold text-neutral-900">Boletines</h1>
        <p className="text-sm text-neutral-500">Boletín académico por período.</p>
      </div>
      <ChildGate>{(child) => <ReportCardContent child={child} />}</ChildGate>
    </div>
  )
}

function ReportCardContent({ child }: { child: StudentWithCourse }) {
  const { showToast } = useToast()
  const [periodId, setPeriodId] = useState('')
  const [report, setReport] = useState<StudentReportData | null>(null)
  const [loadedKey, setLoadedKey] = useState<string | null>(null)

  const { data: periods } = useSimpleQuery(listAcademicPeriods, [] as AcademicPeriod[], () =>
    showToast('error', 'No se pudieron cargar los períodos académicos.'),
  )

  const currentKey = periodId ? `${child.id}:${periodId}` : null
  const loading = Boolean(currentKey) && loadedKey !== currentKey

  useEffect(() => {
    if (!currentKey) return
    const period = periods.find((p) => p.id === periodId)
    if (!period) return

    let active = true
    getStudentReport(child.id, period)
      .then((result) => {
        if (!active) return
        setReport(result)
        setLoadedKey(currentKey)
      })
      .catch(() => {
        if (!active) return
        showToast('error', 'No se pudo generar el boletín.')
        setLoadedKey(currentKey)
      })

    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentKey])

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end print:hidden">
        <Select
          label="Período académico"
          value={periodId}
          onChange={(e) => setPeriodId(e.target.value)}
          className="sm:w-64"
        >
          <option value="">Selecciona un período</option>
          {periods.map((p) => (
            <option key={p.id} value={p.id}>
              {periodLabel(p)}
            </option>
          ))}
        </Select>
        {report && !loading && (
          <Button onClick={() => window.print()} className="sm:ml-auto">
            <Printer className="h-4 w-4" />
            Imprimir boletín
          </Button>
        )}
      </div>

      {!periodId ? (
        <EmptyState icon={FileBarChart} title="Selecciona un período" />
      ) : loading ? (
        <div className="space-y-3">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : report ? (
        <ReportCardPreview report={report} />
      ) : null}
    </div>
  )
}
