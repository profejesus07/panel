import { BehaviorView } from '@/components/portal/BehaviorView'
import { StudentGate } from '@/components/portal/StudentGate'

export function BehaviorPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900">Mis observaciones</h1>
        <p className="text-sm text-neutral-500">Observaciones, reconocimientos y compromisos.</p>
      </div>
      <StudentGate>{(student) => <BehaviorView studentId={student.id} />}</StudentGate>
    </div>
  )
}
