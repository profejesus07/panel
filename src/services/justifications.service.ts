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

export async function listJustificationsForStudent(studentId: string): Promise<Justification[]> {
  const { data, error } = await supabase
    .from('absence_justifications')
    .select('*')
    .eq('student_id', studentId)
    .order('requested_at', { ascending: false })

  if (error) throw new Error(getDataErrorMessage(error))
  return data ?? []
}

export interface SubmitJustificationInput {
  studentId: string
  absenceDate: string
  reason: string
  description?: string
  attachmentUrl?: string | null
}

export async function submitJustification(input: SubmitJustificationInput): Promise<Justification> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Debes iniciar sesión para enviar una justificación.')

  const { data, error } = await supabase
    .from('absence_justifications')
    .insert({
      student_id: input.studentId,
      submitted_by: user.id,
      absence_date: input.absenceDate,
      reason: input.reason,
      description: input.description || null,
      attachment_url: input.attachmentUrl || null,
    })
    .select()
    .single()

  if (error) throw new Error(getDataErrorMessage(error))
  return data
}

// El bucket "justificaciones" es privado; igual que con las actas, se
// guarda la ruta y se firma bajo demanda, nunca una URL pública.
export async function uploadJustificationAttachment(file: File, studentId: string): Promise<string> {
  const path = `${studentId}/${Date.now()}-${file.name}`

  const { error } = await supabase.storage
    .from('justificaciones')
    .upload(path, file, { upsert: true, cacheControl: '3600' })

  if (error) {
    throw new Error('No se pudo subir el archivo. Verifica el formato y el tamaño (máx. 10 MB).')
  }

  return path
}

export async function getJustificationAttachmentUrl(path: string): Promise<string> {
  const { data, error } = await supabase.storage.from('justificaciones').createSignedUrl(path, 60 * 60)
  if (error) throw new Error('No se pudo generar el enlace del archivo.')
  return data.signedUrl
}
