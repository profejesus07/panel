import { FileSignature } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import { useToast } from '@/hooks/useToast'
import { supabase } from '@/lib/supabase'
import { getOfficialRecordSignedUrl, type OfficialRecord } from '@/services/officialRecords.service'
import { getDataErrorMessage } from '@/utils/errors'
import { filterRelevantToStudent } from '@/utils/audience'
import { OFFICIAL_RECORD_TYPE_LABELS } from '@/utils/labels'

interface OfficialRecordsViewProps {
  studentId: string
  courseId: string | null
}

export function OfficialRecordsView({ studentId, courseId }: OfficialRecordsViewProps) {
  const { showToast } = useToast()
  const [records, setRecords] = useState<OfficialRecord[]>([])
  const [loadedFor, setLoadedFor] = useState<string | null>(null)
  const loading = loadedFor !== studentId

  useEffect(() => {
    let active = true
    supabase
      .from('official_records')
      .select('*')
      .order('record_date', { ascending: false })
      .then(({ data, error }) => {
        if (!active) return
        if (error) {
          showToast('error', getDataErrorMessage(error))
        } else {
          setRecords(filterRelevantToStudent(data ?? [], studentId, courseId))
        }
        setLoadedFor(studentId)
      })
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId, courseId])

  async function handleView(record: OfficialRecord) {
    if (!record.document_url) return
    try {
      const url = await getOfficialRecordSignedUrl(record.document_url)
      window.open(url, '_blank', 'noopener,noreferrer')
    } catch {
      showToast('error', 'No se pudo abrir el documento.')
    }
  }

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    )
  }

  if (records.length === 0) {
    return <EmptyState icon={FileSignature} title="Sin actas disponibles" />
  }

  return (
    <ul className="space-y-3">
      {records.map((record) => (
        <li key={record.id} className="rounded-xl border border-neutral-200 bg-white p-4">
          <div className="mb-1 flex items-center justify-between gap-2">
            <p className="font-medium text-neutral-900">{record.title}</p>
            <Badge variant="neutral">{OFFICIAL_RECORD_TYPE_LABELS[record.type]}</Badge>
          </div>
          <p className="text-xs text-neutral-400">{record.record_date}</p>
          {record.description && <p className="mt-1 text-sm text-neutral-600">{record.description}</p>}
          {record.document_url && (
            <button
              type="button"
              onClick={() => void handleView(record)}
              className="mt-2 text-sm font-medium text-brand-700 hover:text-brand-800"
            >
              Ver documento
            </button>
          )}
        </li>
      ))}
    </ul>
  )
}
