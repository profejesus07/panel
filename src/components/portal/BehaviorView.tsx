import { HeartHandshake } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import { useToast } from '@/hooks/useToast'
import { listBehaviorRecordsForStudent, type BehaviorRecord } from '@/services/behaviorRecords.service'
import { BEHAVIOR_RECORD_TYPE_LABELS } from '@/utils/labels'

export function BehaviorView({ studentId }: { studentId: string }) {
  const { showToast } = useToast()
  const [records, setRecords] = useState<BehaviorRecord[]>([])
  const [loadedFor, setLoadedFor] = useState<string | null>(null)
  const loading = loadedFor !== studentId

  useEffect(() => {
    let active = true
    listBehaviorRecordsForStudent(studentId)
      .then((result) => {
        if (!active) return
        setRecords(result)
        setLoadedFor(studentId)
      })
      .catch(() => {
        if (!active) return
        showToast('error', 'No se pudieron cargar las observaciones.')
        setLoadedFor(studentId)
      })
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId])

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    )
  }

  if (records.length === 0) {
    return <EmptyState icon={HeartHandshake} title="Sin observaciones registradas" />
  }

  return (
    <ul className="space-y-3">
      {records.map((record) => (
        <li key={record.id} className="rounded-xl border border-neutral-200 bg-white p-4">
          <div className="mb-1.5 flex items-center gap-2">
            <Badge variant="neutral">{BEHAVIOR_RECORD_TYPE_LABELS[record.type]}</Badge>
            <span className="text-xs text-neutral-400">{record.record_date}</span>
          </div>
          {record.title && <p className="font-medium text-neutral-900">{record.title}</p>}
          <p className="text-sm text-neutral-600">{record.description}</p>
        </li>
      ))}
    </ul>
  )
}
