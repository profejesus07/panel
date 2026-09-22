import { JustificationsView } from '@/components/portal/JustificationsView'
import { StudentGate } from '@/components/portal/StudentGate'

export function JustificationsPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900">Justificaciones</h1>
        <p className="text-sm text-neutral-500">Envía y consulta tus justificaciones de inasistencia.</p>
      </div>
      <StudentGate>{(student) => <JustificationsView studentId={student.id} />}</StudentGate>
    </div>
  )
}
