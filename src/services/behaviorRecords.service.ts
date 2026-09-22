import { supabase } from '@/lib/supabase'
import type { Tables, TablesInsert, TablesUpdate } from '@/types/database.types'
import { getDataErrorMessage } from '@/utils/errors'

export type BehaviorRecord = Tables<'behavior_records'>
export type BehaviorRecordInput = Omit<
  TablesInsert<'behavior_records'>,
  'id' | 'created_at' | 'updated_at' | 'created_by'
>
export type BehaviorRecordUpdate = TablesUpdate<'behavior_records'>

export async function listBehaviorRecordsForStudent(studentId: string): Promise<BehaviorRecord[]> {
  const { data, error } = await supabase
    .from('behavior_records')
    .select('*')
    .eq('student_id', studentId)
    .order('record_date', { ascending: false })

  if (error) throw new Error(getDataErrorMessage(error))
  return data ?? []
}

export async function createBehaviorRecord(input: BehaviorRecordInput): Promise<BehaviorRecord> {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('behavior_records')
    .insert({ ...input, created_by: user?.id ?? null })
    .select()
    .single()

  if (error) throw new Error(getDataErrorMessage(error))
  return data
}

export async function updateBehaviorRecord(
  id: string,
  input: BehaviorRecordUpdate,
): Promise<BehaviorRecord> {
  const { data, error } = await supabase
    .from('behavior_records')
    .update(input)
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(getDataErrorMessage(error))
  return data
}

export async function deleteBehaviorRecord(id: string): Promise<void> {
  const { error } = await supabase.from('behavior_records').delete().eq('id', id)
  if (error) throw new Error(getDataErrorMessage(error))
}
