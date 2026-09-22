import { supabase } from '@/lib/supabase'
import type { Tables, TablesInsert, TablesUpdate } from '@/types/database.types'
import { getDataErrorMessage } from '@/utils/errors'

export type StudentGuardianLink = Tables<'student_guardians'>
export type StudentGuardianLinkInput = Omit<TablesInsert<'student_guardians'>, 'id' | 'created_at'>
export type StudentGuardianLinkUpdate = TablesUpdate<'student_guardians'>

export interface LinkWithStudent extends StudentGuardianLink {
  students: Pick<Tables<'students'>, 'id' | 'first_name' | 'last_name' | 'student_code'> | null
}

export interface LinkWithGuardian extends StudentGuardianLink {
  guardians: Pick<Tables<'guardians'>, 'id' | 'first_name' | 'last_name' | 'phone' | 'email'> | null
}

export async function listLinksForGuardian(guardianId: string): Promise<LinkWithStudent[]> {
  const { data, error } = await supabase
    .from('student_guardians')
    .select('*, students(id, first_name, last_name, student_code)')
    .eq('guardian_id', guardianId)
    .order('created_at')

  if (error) throw new Error(getDataErrorMessage(error))
  return (data ?? []) as LinkWithStudent[]
}

export async function listLinksForStudent(studentId: string): Promise<LinkWithGuardian[]> {
  const { data, error } = await supabase
    .from('student_guardians')
    .select('*, guardians(id, first_name, last_name, phone, email)')
    .eq('student_id', studentId)
    .order('created_at')

  if (error) throw new Error(getDataErrorMessage(error))
  return (data ?? []) as LinkWithGuardian[]
}

export async function createLink(input: StudentGuardianLinkInput): Promise<StudentGuardianLink> {
  const { data, error } = await supabase
    .from('student_guardians')
    .insert(input)
    .select()
    .single()

  if (error) throw new Error(getDataErrorMessage(error))
  return data
}

export async function updateLink(
  id: string,
  input: StudentGuardianLinkUpdate,
): Promise<StudentGuardianLink> {
  const { data, error } = await supabase
    .from('student_guardians')
    .update(input)
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(getDataErrorMessage(error))
  return data
}

export async function deleteLink(id: string): Promise<void> {
  const { error } = await supabase.from('student_guardians').delete().eq('id', id)
  if (error) throw new Error(getDataErrorMessage(error))
}
