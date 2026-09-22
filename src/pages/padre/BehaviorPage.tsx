import { BehaviorView } from '@/components/portal/BehaviorView'
import { ChildGate } from '@/components/portal/ChildGate'

export function BehaviorPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900">Observaciones</h1>
        <p className="text-sm text-neutral-500">Observaciones, reconocimientos y compromisos.</p>
      </div>
      <ChildGate>{(child) => <BehaviorView studentId={child.id} />}</ChildGate>
    </div>
  )
}
