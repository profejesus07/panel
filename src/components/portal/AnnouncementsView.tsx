import { Megaphone } from 'lucide-react'
import { useEffect, useState } from 'react'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import { useToast } from '@/hooks/useToast'
import { supabase } from '@/lib/supabase'
import type { Announcement } from '@/services/announcements.service'
import { getDataErrorMessage } from '@/utils/errors'
import { filterRelevantToStudent } from '@/utils/audience'

interface AnnouncementsViewProps {
  studentId: string
  courseId: string | null
}

export function AnnouncementsView({ studentId, courseId }: AnnouncementsViewProps) {
  const { showToast } = useToast()
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loadedFor, setLoadedFor] = useState<string | null>(null)
  const loading = loadedFor !== studentId

  useEffect(() => {
    let active = true
    supabase
      .from('announcements')
      .select('*')
      .lte('publish_at', new Date().toISOString())
      .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
      .order('publish_at', { ascending: false })
      .then(({ data, error }) => {
        if (!active) return
        if (error) {
          showToast('error', getDataErrorMessage(error))
        } else {
          setAnnouncements(filterRelevantToStudent(data ?? [], studentId, courseId))
        }
        setLoadedFor(studentId)
      })
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId, courseId])

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    )
  }

  if (announcements.length === 0) {
    return <EmptyState icon={Megaphone} title="Sin anuncios activos" />
  }

  return (
    <ul className="space-y-4">
      {announcements.map((announcement) => (
        <li key={announcement.id} className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
          {announcement.image_url && (
            <img src={announcement.image_url} alt="" className="h-40 w-full object-cover" />
          )}
          <div className="p-4">
            <p className="font-semibold text-neutral-900">{announcement.title}</p>
            <p className="mb-1 text-xs text-neutral-400">
              {new Date(announcement.publish_at).toLocaleDateString('es-CO', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
            <p className="text-sm text-neutral-600">{announcement.content}</p>
          </div>
        </li>
      ))}
    </ul>
  )
}
