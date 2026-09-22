import type { Enums } from '@/types/database.types'

interface AudienceScoped {
  audience: Enums<'audience_scope'>
  course_id: string | null
  student_id: string | null
}

// RLS ya garantiza que solo lleguen registros que el usuario puede ver en
// general; este filtro adicional del lado del cliente acota esos registros
// a los que aplican al estudiante concreto que se está consultando (útil
// para un padre con varios hijos: no mezclar actas/anuncios de audience
// "estudiante"/"curso" de un hijo con los de otro).
export function filterRelevantToStudent<T extends AudienceScoped>(
  items: T[],
  studentId: string,
  courseId: string | null,
): T[] {
  return items.filter((item) => {
    switch (item.audience) {
      case 'estudiante':
        return item.student_id === studentId
      case 'curso':
        return courseId !== null && item.course_id === courseId
      default:
        return true
    }
  })
}
