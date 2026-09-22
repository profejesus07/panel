import { supabase } from '@/lib/supabase'
import type { ListResult, PaginationParams } from '@/types/common'
import { DEFAULT_PAGE_SIZE } from '@/types/common'
import type { Tables, TablesUpdate } from '@/types/database.types'
import { getDataErrorMessage } from '@/utils/errors'

export type OfficialRecord = Tables<'official_records'>
// Basado en el tipo Row (no Insert): en el formulario todos los campos
// siempre tienen un valor definido (o null explícito), nunca undefined.
export type OfficialRecordInput = Omit<
  OfficialRecord,
  'id' | 'created_at' | 'updated_at' | 'created_by'
>
export type OfficialRecordUpdate = TablesUpdate<'official_records'>

export interface ListOfficialRecordsParams extends PaginationParams {
  status?: OfficialRecord['status']
}

export async function listOfficialRecords(
  params: ListOfficialRecordsParams = {},
): Promise<ListResult<OfficialRecord>> {
  const { page = 1, pageSize = DEFAULT_PAGE_SIZE, status } = params
  let query = supabase.from('official_records').select('*', { count: 'exact' })
  if (status) query = query.eq('status', status)

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const { data, error, count } = await query
    .order('record_date', { ascending: false })
    .range(from, to)

  if (error) throw new Error(getDataErrorMessage(error))
  return { data: data ?? [], count: count ?? 0 }
}

export async function createOfficialRecord(input: OfficialRecordInput): Promise<OfficialRecord> {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('official_records')
    .insert({ ...input, created_by: user?.id ?? null })
    .select()
    .single()

  if (error) throw new Error(getDataErrorMessage(error))
  return data
}

export async function updateOfficialRecord(
  id: string,
  input: OfficialRecordUpdate,
): Promise<OfficialRecord> {
  const { data, error } = await supabase
    .from('official_records')
    .update(input)
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(getDataErrorMessage(error))
  return data
}

export async function deleteOfficialRecord(id: string): Promise<void> {
  const { error } = await supabase.from('official_records').delete().eq('id', id)
  if (error) throw new Error(getDataErrorMessage(error))
}

// El bucket "actas" es privado: se guarda la ruta del objeto en
// document_url (no una URL pública) y se firma bajo demanda al
// consultarla, para que el enlace no quede embebido permanentemente
// en la base de datos ni funcione fuera de las políticas de RLS.
export async function uploadOfficialRecordDocument(
  file: File,
  studentId: string | null,
): Promise<string> {
  const folder = studentId ?? 'institucional'
  const path = `${folder}/${Date.now()}-${file.name}`

  const { error } = await supabase.storage
    .from('actas')
    .upload(path, file, { upsert: true, cacheControl: '3600' })

  if (error) {
    throw new Error('No se pudo subir el documento. Verifica que sea un PDF de máximo 10 MB.')
  }

  return path
}

export async function getOfficialRecordSignedUrl(path: string): Promise<string> {
  const { data, error } = await supabase.storage.from('actas').createSignedUrl(path, 60 * 60)
  if (error) throw new Error('No se pudo generar el enlace del documento.')
  return data.signedUrl
}
