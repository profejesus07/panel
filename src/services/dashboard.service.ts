import { supabase } from '@/lib/supabase'
import type { Tables } from '@/types/database.types'
import { getDataErrorMessage } from '@/utils/errors'

export interface DashboardStats {
  studentsCount: number
  guardiansCount: number
  activeCoursesCount: number
  pendingJustificationsCount: number
  activeAnnouncementsCount: number
  attendanceToday: { present: number; total: number } | null
}

function assertNoError(label: string, error: { message: string } | null) {
  if (error) throw new Error(`${label}: ${getDataErrorMessage(error)}`)
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const today = new Date().toISOString().slice(0, 10)
  const now = new Date().toISOString()

  const [students, guardians, courses, justifications, announcements, attendance] = await Promise.all([
    supabase.from('students').select('id', { count: 'exact', head: true }),
    supabase.from('guardians').select('id', { count: 'exact', head: true }),
    supabase.from('courses').select('id', { count: 'exact', head: true }).eq('status', 'activo'),
    supabase
      .from('absence_justifications')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pendiente'),
    supabase
      .from('announcements')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'publicado')
      .lte('publish_at', now)
      .or(`expires_at.is.null,expires_at.gt.${now}`),
    supabase.from('attendance').select('status').eq('date', today),
  ])

  assertNoError('Estudiantes', students.error)
  assertNoError('Padres y acudientes', guardians.error)
  assertNoError('Cursos', courses.error)
  assertNoError('Justificaciones', justifications.error)
  assertNoError('Anuncios', announcements.error)
  assertNoError('Asistencia', attendance.error)

  const attendanceRows = (attendance.data ?? []) as Pick<Tables<'attendance'>, 'status'>[]
  const presentToday = attendanceRows.filter((r) => r.status === 'presente').length

  return {
    studentsCount: students.count ?? 0,
    guardiansCount: guardians.count ?? 0,
    activeCoursesCount: courses.count ?? 0,
    pendingJustificationsCount: justifications.count ?? 0,
    activeAnnouncementsCount: announcements.count ?? 0,
    attendanceToday: attendanceRows.length > 0 ? { present: presentToday, total: attendanceRows.length } : null,
  }
}

export interface RecentAnnouncement {
  id: string
  title: string
  publish_at: string
}

export async function listRecentActiveAnnouncements(limit = 4): Promise<RecentAnnouncement[]> {
  const now = new Date().toISOString()

  const { data, error } = await supabase
    .from('announcements')
    .select('id, title, publish_at')
    .eq('status', 'publicado')
    .lte('publish_at', now)
    .or(`expires_at.is.null,expires_at.gt.${now}`)
    .order('publish_at', { ascending: false })
    .limit(limit)

  if (error) throw new Error(getDataErrorMessage(error))
  return data ?? []
}
