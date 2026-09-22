import { supabase } from '@/lib/supabase'
import type { Tables, TablesInsert, TablesUpdate } from '@/types/database.types'
import { getDataErrorMessage } from '@/utils/errors'

export type Subject = Tables<'subjects'>
export type SubjectInput = Omit<TablesInsert<'subjects'>, 'id' | 'created_at'>

export async function listSubjects(): Promise<Subject[]> {
  const { data, error } = await supabase.from('subjects').select('*').order('name')
  if (error) throw new Error(getDataErrorMessage(error))
  return data ?? []
}

export async function createSubject(input: SubjectInput): Promise<Subject> {
  const { data, error } = await supabase.from('subjects').insert(input).select().single()
  if (error) throw new Error(getDataErrorMessage(error))
  return data
}

export async function deleteSubject(id: string): Promise<void> {
  const { error } = await supabase.from('subjects').delete().eq('id', id)
  if (error) throw new Error(getDataErrorMessage(error))
}

export type AcademicPeriod = Tables<'academic_periods'>
export type AcademicPeriodInput = Omit<TablesInsert<'academic_periods'>, 'id' | 'created_at'>
export type AcademicPeriodUpdate = TablesUpdate<'academic_periods'>

export async function listAcademicPeriods(): Promise<AcademicPeriod[]> {
  const { data, error } = await supabase
    .from('academic_periods')
    .select('*')
    .order('academic_year', { ascending: false })
    .order('start_date')

  if (error) throw new Error(getDataErrorMessage(error))
  return data ?? []
}

export async function createAcademicPeriod(input: AcademicPeriodInput): Promise<AcademicPeriod> {
  const { data, error } = await supabase.from('academic_periods').insert(input).select().single()
  if (error) throw new Error(getDataErrorMessage(error))
  return data
}

export async function updateAcademicPeriod(
  id: string,
  input: AcademicPeriodUpdate,
): Promise<AcademicPeriod> {
  const { data, error } = await supabase
    .from('academic_periods')
    .update(input)
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(getDataErrorMessage(error))
  return data
}

export async function deleteAcademicPeriod(id: string): Promise<void> {
  const { error } = await supabase.from('academic_periods').delete().eq('id', id)
  if (error) throw new Error(getDataErrorMessage(error))
}

export function periodLabel(period: Pick<AcademicPeriod, 'name' | 'academic_year'>): string {
  return `${period.name} (${period.academic_year})`
}
