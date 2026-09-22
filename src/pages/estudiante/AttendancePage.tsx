import { AttendanceView } from '@/components/portal/AttendanceView'
import { StudentGate } from '@/components/portal/StudentGate'

export function AttendancePage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900">Mi asistencia</h1>
        <p className="text-sm text-neutral-500">Tu historial de asistencia.</p>
      </div>
      <StudentGate>{(student) => <AttendanceView studentId={student.id} />}</StudentGate>
    </div>
  )
}
