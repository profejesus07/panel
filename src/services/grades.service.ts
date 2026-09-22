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
