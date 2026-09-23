import { supabase } from '@/lib/supabase'
import type { Tables, TablesInsert, TablesUpdate } from '@/types/database.types'
import { getDataErrorMessage } from '@/utils/errors'

export type Grade = Tables<'grades'>
export type GradeInput = Omit<TablesInsert<'grades'>, 'id' | 'created_at' | 'updated_at' | 'created_by'>
export type GradeUpdate = TablesUpdate<'grades'>

export interface GradeWithRefs extends Grade {
  subjects: Pick<Tables<'subjects'>, 'id' | 'name'> | null
  academic_periods: Pick<Tables<'academic_periods'>, 'id' | 'name' | 'academic_year'> | null
}

const GRADE_SELECT = '*, subjects(id, name), academic_periods(id, name, academic_year)'

export async function listGradesForStudent(studentId: string): Promise<GradeWithRefs[]> {
  const { data, error } = await supabase
    .from('grades')
    .select(GRADE_SELECT)
    .eq('student_id', studentId)
    .order('graded_at', { ascending: false })

  if (error) throw new Error(getDataErrorMessage(error))
  return (data ?? []) as GradeWithRefs[]
}

// Calificaciones consolidadas de varios estudiantes (un curso) para una
// asignatura y un período. Incluye las importadas desde Excel, que no
// tienen notas parciales detrás.
export async function listGradesForGroup(
  studentIds: string[],
  subjectId: string,
  periodId: string,
): Promise<Grade[]> {
  if (studentIds.length === 0) return []

  const { data, error } = await supabase
    .from('grades')
    .select('*')
    .in('student_id', studentIds)
    .eq('subject_id', subjectId)
    .eq('period_id', periodId)

  if (error) throw new Error(getDataErrorMessage(error))
  return data ?? []
}

export async function createGrade(input: GradeInput): Promise<Grade> {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('grades')
    .insert({ ...input, created_by: user?.id ?? null })
    .select()
    .single()

  if (error) throw new Error(getDataErrorMessage(error))
  return data
}

// Inserta o, si ya existe una calificación para ese estudiante+asignatura+
// período (la restricción unique de la tabla), la reemplaza — usado por la
// importación masiva para que reimportar el mismo archivo corregido no
// falle por duplicado, sino que actualice el valor.
export async function upsertGrade(input: GradeInput): Promise<Grade> {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('grades')
    .upsert(
      { ...input, created_by: user?.id ?? null },
      { onConflict: 'student_id,subject_id,period_id' },
    )
    .select()
    .single()

  if (error) throw new Error(getDataErrorMessage(error))
  return data
}

export async function updateGrade(id: string, input: GradeUpdate): Promise<Grade> {
  const { data, error } = await supabase
    .from('grades')
    .update(input)
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(getDataErrorMessage(error))
  return data
}

export async function deleteGrade(id: string): Promise<void> {
  const { error } = await supabase.from('grades').delete().eq('id', id)
  if (error) throw new Error(getDataErrorMessage(error))
}

export interface GradeStatRow {
  score: number
  status: Grade['status']
  subject_id: string
  period_id: string
  subjects: Pick<Tables<'subjects'>, 'id' | 'name'> | null
  academic_periods: Pick<Tables<'academic_periods'>, 'id' | 'name' | 'academic_year'> | null
}

export interface GradeStatsFilters {
  courseId?: string
  subjectId?: string
  periodId?: string
}

const GRADE_STATS_SELECT =
  'score, status, subject_id, period_id, subjects(id, name), academic_periods(id, name, academic_year), students!inner(id, course_id)'

// Trae las calificaciones de todos los estudiantes (no solo uno) para
// alimentar la pestaña de Estadísticas. El join a students es !inner para
// poder filtrar por curso a través de una relación anidada en PostgREST.
export async function listGradesForStats(filters: GradeStatsFilters = {}): Promise<GradeStatRow[]> {
  let query = supabase.from('grades').select(GRADE_STATS_SELECT)

  if (filters.subjectId) query = query.eq('subject_id', filters.subjectId)
  if (filters.periodId) query = query.eq('period_id', filters.periodId)
  if (filters.courseId) query = query.eq('students.course_id', filters.courseId)

  const { data, error } = await query
  if (error) throw new Error(getDataErrorMessage(error))
  return (data ?? []) as unknown as GradeStatRow[]
}
