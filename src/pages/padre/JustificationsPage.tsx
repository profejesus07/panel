import { JustificationsView } from '@/components/portal/JustificationsView'
import { ChildGate } from '@/components/portal/ChildGate'

export function JustificationsPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900">Justificaciones</h1>
        <p className="text-sm text-neutral-500">Envía y consulta justificaciones de inasistencia.</p>
      </div>
      <ChildGate>{(child) => <JustificationsView studentId={child.id} />}</ChildGate>
    </div>
  )
}
