import { AnnouncementsView } from '@/components/portal/AnnouncementsView'
import { ChildGate } from '@/components/portal/ChildGate'

export function AnnouncementsPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900">Anuncios</h1>
        <p className="text-sm text-neutral-500">Anuncios institucionales para ti y tu(s) hijo(s).</p>
      </div>
      <ChildGate>{(child) => <AnnouncementsView studentId={child.id} courseId={child.course_id} />}</ChildGate>
    </div>
  )
}
