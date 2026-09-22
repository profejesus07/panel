import { GradesView } from '@/components/portal/GradesView'
import { ChildGate } from '@/components/portal/ChildGate'

export function GradesPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900">Calificaciones</h1>
        <p className="text-sm text-neutral-500">Calificaciones por asignatura y período.</p>
      </div>
      <ChildGate>{(child) => <GradesView studentId={child.id} />}</ChildGate>
    </div>
  )
}
