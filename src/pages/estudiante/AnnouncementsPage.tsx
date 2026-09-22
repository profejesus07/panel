import { AnnouncementsView } from '@/components/portal/AnnouncementsView'
import { StudentGate } from '@/components/portal/StudentGate'

export function AnnouncementsPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900">Anuncios</h1>
        <p className="text-sm text-neutral-500">Anuncios institucionales para ti.</p>
      </div>
      <StudentGate>
        {(student) => <AnnouncementsView studentId={student.id} courseId={student.course_id} />}
      </StudentGate>
    </div>
  )
}
