import { FileBarChart, Printer } from 'lucide-react'
import { useEffect, useState } from 'react'
import { StudentPicker } from '@/components/admin/StudentPicker'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Select } from '@/components/ui/Select'
import { Skeleton } from '@/components/ui/Skeleton'
import { useSimpleQuery } from '@/hooks/useSimpleQuery'
import { useToast } from '@/hooks/useToast'
import { listAcademicPeriods, periodLabel, type AcademicPeriod } from '@/services/academicCatalog.service'
import { getStudentReport, type StudentReportData } from '@/services/reports.service'
import { studentFullName, type StudentWithCourse } from '@/services/students.service'
import {
  ATTENDANCE_STATUS_LABELS,
  BEHAVIOR_RECORD_TYPE_LABELS,
  DOCUMENT_TYPE_LABELS,
} from '@/utils/labels'

export function ReportCardsPage() {
  const { showToast } = useToast()
  const [student, setStudent] = useState<StudentWithCourse | null>(null)
  const [periodId, setPeriodId] = useState('')
  const [report, setReport] = useState<StudentReportData | null>(null)
  const [loadedKey, setLoadedKey] = useState<string | null>(null)

  const { data: periods } = useSimpleQuery(listAcademicPeriods, [] as AcademicPeriod[], () =>
    showToast('error', 'No se pudieron cargar los períodos académicos.'),
  )

  const currentKey = student && periodId ? `${student.id}:${periodId}` : null
  const loading = Boolean(currentKey) && loadedKey !== currentKey

  useEffect(() => {
    if (!currentKey || !student) return
    const period = periods.find((p) => p.id === periodId)
    if (!period) return

    let active = true
    getStudentReport(student.id, period)
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
      <div className="mb-6 print:hidden">
        <h1 className="text-2xl font-bold text-neutral-900">Boletines</h1>
        <p className="text-sm text-neutral-500">
          Genera la vista previa del boletín académico de un estudiante por período.
        </p>
      </div>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end print:hidden">
        <div className="max-w-sm flex-1">
          <StudentPicker value={student} onChange={setStudent} />
        </div>
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

      {!student || !periodId ? (
        <EmptyState
          icon={FileBarChart}
          title="Selecciona un estudiante y un período"
          description="El boletín combina calificaciones, asistencia y convivencia del período elegido."
        />
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

function ReportCardPreview({ report }: { report: StudentReportData }) {
  const { student, period, schoolSettings, grades, attendanceCounts, behaviorRecords } = report
  const totalAttendance =
    attendanceCounts.presente + attendanceCounts.ausente + attendanceCounts.tarde + attendanceCounts.justificado

  return (
    <div className="mx-auto max-w-3xl rounded-xl border border-neutral-200 bg-white p-8 shadow-sm print:max-w-none print:rounded-none print:border-0 print:shadow-none">
      <div className="mb-6 flex items-center gap-4 border-b border-neutral-200 pb-6">
        {schoolSettings?.logo_url ? (
          <img src={schoolSettings.logo_url} alt="" className="h-16 w-16 object-contain" />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
            <FileBarChart className="h-7 w-7" />
          </div>
        )}
        <div>
          <h2 className="text-lg font-bold text-neutral-900">{schoolSettings?.name ?? 'Panel Escolar'}</h2>
          {schoolSettings?.nit && <p className="text-xs text-neutral-500">NIT {schoolSettings.nit}</p>}
          <p className="text-sm font-medium text-brand-700">
            Boletín académico — {periodLabel(period)}
          </p>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-4">
        <div>
          <p className="text-neutral-500">Estudiante</p>
          <p className="font-medium text-neutral-900">{studentFullName(student)}</p>
        </div>
        <div>
          <p className="text-neutral-500">Documento</p>
          <p className="font-medium text-neutral-900">
            {DOCUMENT_TYPE_LABELS[student.document_type]} {student.document_number}
          </p>
        </div>
        <div>
          <p className="text-neutral-500">Código</p>
          <p className="font-medium text-neutral-900">{student.student_code}</p>
        </div>
        <div>
          <p className="text-neutral-500">Curso</p>
          <p className="font-medium text-neutral-900">
            {student.courses ? `${student.courses.grade} - ${student.courses.group_name}` : '—'}
          </p>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="mb-2 text-sm font-semibold text-neutral-900">Calificaciones</h3>
        {grades.length === 0 ? (
          <p className="text-sm text-neutral-500">Sin calificaciones registradas en este período.</p>
        ) : (
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-neutral-300 text-left text-xs uppercase text-neutral-500">
                <th className="py-2">Asignatura</th>
                <th className="py-2">Calificación</th>
                <th className="py-2">Observación</th>
              </tr>
            </thead>
            <tbody>
              {grades.map((grade) => (
                <tr key={grade.id} className="border-b border-neutral-100">
                  <td className="py-2 text-neutral-900">{grade.subjects?.name ?? '—'}</td>
                  <td className="py-2 font-semibold text-neutral-900">
                    {grade.score} <span className="font-normal text-neutral-400">/ {grade.scale}</span>
                  </td>
                  <td className="py-2 text-neutral-600">{grade.observation ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="mb-6">
        <h3 className="mb-2 text-sm font-semibold text-neutral-900">Asistencia del período</h3>
        {totalAttendance === 0 ? (
          <p className="text-sm text-neutral-500">Sin registros de asistencia en este período.</p>
        ) : (
          <div className="grid grid-cols-4 gap-3 text-center text-sm">
            {(Object.keys(attendanceCounts) as (keyof typeof attendanceCounts)[]).map((status) => (
              <div key={status} className="rounded-lg border border-neutral-200 py-3">
                <p className="text-lg font-bold text-neutral-900">{attendanceCounts[status]}</p>
                <p className="text-xs text-neutral-500">{ATTENDANCE_STATUS_LABELS[status]}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h3 className="mb-2 text-sm font-semibold text-neutral-900">Convivencia</h3>
        {behaviorRecords.length === 0 ? (
          <p className="text-sm text-neutral-500">Sin observaciones registradas en este período.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {behaviorRecords.map((record) => (
              <li key={record.id} className="rounded-lg border border-neutral-200 px-3 py-2">
                <div className="mb-1 flex items-center gap-2">
                  <Badge variant="neutral">{BEHAVIOR_RECORD_TYPE_LABELS[record.type]}</Badge>
                  <span className="text-xs text-neutral-400">{record.record_date}</span>
                </div>
                {record.title && <p className="font-medium text-neutral-900">{record.title}</p>}
                <p className="text-neutral-600">{record.description}</p>
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className="mt-8 text-right text-xs text-neutral-400">
        Generado el {new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })}
      </p>
    </div>
  )
}
