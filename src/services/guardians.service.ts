import { supabase } from '@/lib/supabase'
import type { ListResult, PaginationParams } from '@/types/common'
import { DEFAULT_PAGE_SIZE } from '@/types/common'
import type { Tables, TablesInsert, TablesUpdate } from '@/types/database.types'
import { getDataErrorMessage } from '@/utils/errors'

export type Guardian = Tables<'guardians'>
export type GuardianInput = Omit<TablesInsert<'guardians'>, 'id' | 'created_at' | 'updated_at'>
export type GuardianUpdate = TablesUpdate<'guardians'>

export interface ListGuardiansParams extends PaginationParams {
  search?: string
}

export async function listGuardians(
  params: ListGuardiansParams = {},
): Promise<ListResult<Guardian>> {
  const { page = 1, pageSize = DEFAULT_PAGE_SIZE, search } = params
  let query = supabase.from('guardians').select('*', { count: 'exact' })

  if (search) {
    const term = search.trim()
    query = query.or(
      `first_name.ilike.%${term}%,last_name.ilike.%${term}%,document_number.ilike.%${term}%`,
    )
  }

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const { data, error, count } = await query
    .order('last_name')
    .order('first_name')
    .range(from, to)

  if (error) throw new Error(getDataErrorMessage(error))
  return { data: data ?? [], count: count ?? 0 }
}

export async function createGuardian(input: GuardianInput): Promise<Guardian> {
  const { data, error } = await supabase.from('guardians').insert(input).select().single()
  if (error) throw new Error(getDataErrorMessage(error))
  return data
}

export async function updateGuardian(id: string, input: GuardianUpdate): Promise<Guardian> {
  const { data, error } = await supabase
    .from('guardians')
    .update(input)
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(getDataErrorMessage(error))
  return data
}

export async function deleteGuardian(id: string): Promise<void> {
  const { error } = await supabase.from('guardians').delete().eq('id', id)
  if (error) throw new Error(getDataErrorMessage(error))
}

export function guardianFullName(guardian: Pick<Guardian, 'first_name' | 'last_name'>): string {
  return `${guardian.first_name} ${guardian.last_name}`
}
