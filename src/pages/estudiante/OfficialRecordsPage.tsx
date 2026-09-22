import { OfficialRecordsView } from '@/components/portal/OfficialRecordsView'
import { StudentGate } from '@/components/portal/StudentGate'

export function OfficialRecordsPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900">Mis actas</h1>
        <p className="text-sm text-neutral-500">Actas institucionales dirigidas a ti.</p>
      </div>
      <StudentGate>
        {(student) => <OfficialRecordsView studentId={student.id} courseId={student.course_id} />}
      </StudentGate>
    </div>
  )
}
