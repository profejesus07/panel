import { StudentPicker } from '@/components/admin/StudentPicker'
import { Select } from '@/components/ui/Select'
import { courseLabel, type Course } from '@/services/courses.service'
import type { StudentWithCourse } from '@/services/students.service'
import { Constants, type Enums } from '@/types/database.types'
import { AUDIENCE_SCOPE_LABELS } from '@/utils/labels'

interface AudienceFieldsProps {
  audience: Enums<'audience_scope'>
  onAudienceChange: (audience: Enums<'audience_scope'>) => void
  courses: Course[]
  courseId: string | null
  onCourseChange: (courseId: string | null) => void
  student: StudentWithCourse | null
  onStudentChange: (student: StudentWithCourse | null) => void
}

// Selector de audiencia compartido por anuncios y actas: quién puede verlo
// además del admin (todos / solo estudiantes / solo padres / un curso / un
// estudiante). Refleja exactamente can_view_by_audience() en la base de datos.
export function AudienceFields({
  audience,
  onAudienceChange,
  courses,
  courseId,
  onCourseChange,
  student,
  onStudentChange,
}: AudienceFieldsProps) {
  return (
    <div className="space-y-4">
      <Select
        label="Audiencia"
        value={audience}
        onChange={(e) => onAudienceChange(e.target.value as Enums<'audience_scope'>)}
      >
        {Constants.public.Enums.audience_scope.map((scope) => (
          <option key={scope} value={scope}>
            {AUDIENCE_SCOPE_LABELS[scope]}
          </option>
        ))}
      </Select>

      {audience === 'curso' && (
        <Select
          label="Curso"
          value={courseId ?? ''}
          onChange={(e) => onCourseChange(e.target.value || null)}
        >
          <option value="">Selecciona un curso</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {courseLabel(c)} ({c.academic_year})
            </option>
          ))}
        </Select>
      )}

      {audience === 'estudiante' && <StudentPicker value={student} onChange={onStudentChange} />}
    </div>
  )
}
