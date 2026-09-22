import { supabase } from '@/lib/supabase'
import type { ListResult, PaginationParams } from '@/types/common'
import { DEFAULT_PAGE_SIZE } from '@/types/common'
import type { Tables, TablesUpdate } from '@/types/database.types'
import { getDataErrorMessage } from '@/utils/errors'

export type Announcement = Tables<'announcements'>
// Basado en el tipo Row (no Insert): en el formulario todos los campos
// siempre tienen un valor definido (o null explícito), nunca undefined.
export type AnnouncementInput = Omit<Announcement, 'id' | 'created_at' | 'updated_at' | 'created_by'>
export type AnnouncementUpdate = TablesUpdate<'announcements'>

export interface ListAnnouncementsParams extends PaginationParams {
  status?: Announcement['status']
}

export async function listAnnouncements(
  params: ListAnnouncementsParams = {},
): Promise<ListResult<Announcement>> {
  const { page = 1, pageSize = DEFAULT_PAGE_SIZE, status } = params
  let query = supabase.from('announcements').select('*', { count: 'exact' })
  if (status) query = query.eq('status', status)

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const { data, error, count } = await query
    .order('publish_at', { ascending: false })
    .range(from, to)

  if (error) throw new Error(getDataErrorMessage(error))
  return { data: data ?? [], count: count ?? 0 }
}

export async function createAnnouncement(input: AnnouncementInput): Promise<Announcement> {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('announcements')
    .insert({ ...input, created_by: user?.id ?? null })
    .select()
    .single()

  if (error) throw new Error(getDataErrorMessage(error))
  return data
}

export async function updateAnnouncement(
  id: string,
  input: AnnouncementUpdate,
): Promise<Announcement> {
  const { data, error } = await supabase
    .from('announcements')
    .update(input)
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(getDataErrorMessage(error))
  return data
}

export async function deleteAnnouncement(id: string): Promise<void> {
  const { error } = await supabase.from('announcements').delete().eq('id', id)
  if (error) throw new Error(getDataErrorMessage(error))
}

export async function uploadAnnouncementImage(file: File): Promise<string> {
  const extension = file.name.split('.').pop() ?? 'jpg'
  const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`

  const { error } = await supabase.storage
    .from('anuncios')
    .upload(path, file, { upsert: true, cacheControl: '3600' })

  if (error) {
    throw new Error('No se pudo subir la imagen. Verifica el formato (PNG, JPG o WebP) y el tamaño (máx. 5 MB).')
  }

  const { data } = supabase.storage.from('anuncios').getPublicUrl(path)
  return data.publicUrl
}
