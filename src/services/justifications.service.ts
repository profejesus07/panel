import { supabase } from '@/lib/supabase'
import type { ListResult, PaginationParams } from '@/types/common'
import { DEFAULT_PAGE_SIZE } from '@/types/common'
import type { Tables } from '@/types/database.types'
import { getDataErrorMessage } from '@/utils/errors'

export type Justification = Tables<'absence_justifications'>

export interface JustificationWithStudent extends Justification {
  students: Pick<Tables<'students'>, 'id' | 'first_name' | 'last_name' | 'student_code'> | null
}

export interface ListJustificationsParams extends PaginationParams {
  status?: Justification['status']
}

export async function listJustifications(
  params: ListJustificationsParams = {},
): Promise<ListResult<JustificationWithStudent>> {
  const { page = 1, pageSize = DEFAULT_PAGE_SIZE, status } = params
  let query = supabase
    .from('absence_justifications')
    .select('*, students(id, first_name, last_name, student_code)', { count: 'exact' })

  if (status) query = query.eq('status', status)

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const { data, error, count } = await query
    .order('requested_at', { ascending: false })
    .range(from, to)

  if (error) throw new Error(getDataErrorMessage(error))
  return { data: (data ?? []) as JustificationWithStudent[], count: count ?? 0 }
}

export async function approveJustification(id: string, reviewNotes?: string): Promise<void> {
  const { error } = await supabase.rpc('approve_justification', {
    p_justification_id: id,
    p_review_notes: reviewNotes || undefined,
  })
  if (error) throw new Error(getDataErrorMessage(error))
}

export async function rejectJustification(id: string, reviewNotes?: string): Promise<void> {
  const { error } = await supabase.rpc('reject_justification', {
    p_justification_id: id,
    p_review_notes: reviewNotes || undefined,
  })
  if (error) throw new Error(getDataErrorMessage(error))
}
