import { FileBarChart } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { periodLabel } from '@/services/academicCatalog.service'
import { studentFullName } from '@/services/students.service'
import type { StudentReportData } from '@/services/reports.service'
import {
  ATTENDANCE_STATUS_LABELS,
  BEHAVIOR_RECORD_TYPE_LABELS,
  DOCUMENT_TYPE_LABELS,
} from '@/utils/labels'

// Vista imprimible del boletín, compartida por el panel de administración
// (cualquier estudiante/período) y el portal del padre (solo sus hijos).
export function ReportCardPreview({ report }: { report: StudentReportData }) {
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
