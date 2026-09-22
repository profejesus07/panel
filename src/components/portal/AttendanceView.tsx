import { CalendarCheck } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/Badge'
import { Card, CardContent } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import { useToast } from '@/hooks/useToast'
import { listAttendanceForStudent, type AttendanceWithCourse } from '@/services/attendance.service'
import { courseLabel } from '@/services/courses.service'
import { ATTENDANCE_STATUS_LABELS } from '@/utils/labels'

const STATUS_BADGE_VARIANT: Record<AttendanceWithCourse['status'], 'success' | 'danger' | 'warning' | 'brand'> = {
  presente: 'success',
  ausente: 'danger',
  tarde: 'warning',
  justificado: 'brand',
}

export function AttendanceView({ studentId }: { studentId: string }) {
  const { showToast } = useToast()
  const [records, setRecords] = useState<AttendanceWithCourse[]>([])
  const [loadedFor, setLoadedFor] = useState<string | null>(null)
  const loading = loadedFor !== studentId

  useEffect(() => {
    let active = true
    listAttendanceForStudent(studentId)
      .then((result) => {
        if (!active) return
        setRecords(result)
        setLoadedFor(studentId)
      })
      .catch(() => {
        if (!active) return
        showToast('error', 'No se pudo cargar la asistencia.')
        setLoadedFor(studentId)
      })
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId])

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    )
  }

  if (records.length === 0) {
    return <EmptyState icon={CalendarCheck} title="Sin registros de asistencia" />
  }

  const counts = { presente: 0, ausente: 0, tarde: 0, justificado: 0 }
  for (const record of records) counts[record.status] += 1

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {(Object.keys(counts) as (keyof typeof counts)[]).map((status) => (
          <Card key={status}>
            <CardContent className="text-center">
              <p className="text-2xl font-bold text-neutral-900">{counts[status]}</p>
              <p className="text-xs text-neutral-500">{ATTENDANCE_STATUS_LABELS[status]}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-neutral-200 text-xs uppercase text-neutral-500">
                <th className="py-2 pr-4">Fecha</th>
                <th className="py-2 pr-4">Curso</th>
                <th className="py-2">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {records.map((record) => (
                <tr key={record.id}>
                  <td className="py-2.5 pr-4 text-neutral-900">{record.date}</td>
                  <td className="py-2.5 pr-4 text-neutral-600">
                    {record.courses ? courseLabel(record.courses) : '—'}
                  </td>
                  <td className="py-2.5">
                    <Badge variant={STATUS_BADGE_VARIANT[record.status]}>
                      {ATTENDANCE_STATUS_LABELS[record.status]}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
