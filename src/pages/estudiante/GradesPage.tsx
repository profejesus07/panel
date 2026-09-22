import { GradesView } from '@/components/portal/GradesView'
import { StudentGate } from '@/components/portal/StudentGate'

export function GradesPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900">Mis calificaciones</h1>
        <p className="text-sm text-neutral-500">Tus calificaciones por asignatura y período.</p>
      </div>
      <StudentGate>{(student) => <GradesView studentId={student.id} />}</StudentGate>
    </div>
  )
}
