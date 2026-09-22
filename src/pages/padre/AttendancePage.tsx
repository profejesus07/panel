import { AttendanceView } from '@/components/portal/AttendanceView'
import { ChildGate } from '@/components/portal/ChildGate'

export function AttendancePage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900">Asistencia</h1>
        <p className="text-sm text-neutral-500">Historial de asistencia.</p>
      </div>
      <ChildGate>{(child) => <AttendanceView studentId={child.id} />}</ChildGate>
    </div>
  )
}
