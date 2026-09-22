import { supabase } from '@/lib/supabase'
import type { StudentWithCourse } from '@/services/students.service'
import { getDataErrorMessage } from '@/utils/errors'

// Para el rol "estudiante": su propio registro de estudiante (RLS ya
// garantiza que students.user_id = auth.uid() es el único que puede leer).
export async function getMyStudentRecord(): Promise<StudentWithCourse | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('students')
    .select('*, courses(grade, group_name)')
    .eq('user_id', user.id)
    .maybeSingle()

  if (error) throw new Error(getDataErrorMessage(error))
  return data as StudentWithCourse | null
}

interface GuardianWithChildren {
  student_guardians: { students: StudentWithCourse | null }[]
}

// Para el rol "padre": todos los estudiantes vinculados a su(s) fila(s) de
// guardians. RLS en guardians ya limita esto a user_id = auth.uid().
export async function listMyChildren(): Promise<StudentWithCourse[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('guardians')
    .select('student_guardians(students(*, courses(grade, group_name)))')
    .eq('user_id', user.id)

  if (error) throw new Error(getDataErrorMessage(error))

  const children: StudentWithCourse[] = []
  for (const guardian of (data ?? []) as unknown as GuardianWithChildren[]) {
    for (const link of guardian.student_guardians ?? []) {
      if (link.students) children.push(link.students)
    }
  }
  return children
}
