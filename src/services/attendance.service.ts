import { supabase } from '@/lib/supabase'
import type { Tables, TablesInsert } from '@/types/database.types'
import { getDataErrorMessage } from '@/utils/errors'

export type Attendance = Tables<'attendance'>
export type AttendanceInput = Omit<TablesInsert<'attendance'>, 'id' | 'created_at' | 'recorded_by'>

export interface AttendanceWithCourse extends Attendance {
  courses: Pick<Tables<'courses'>, 'grade' | 'group_name'> | null
}

export async function listAttendanceForCourseDate(
  courseId: string,
  date: string,
): Promise<Attendance[]> {
  const { data, error } = await supabase
    .from('attendance')
    .select('*')
    .eq('course_id', courseId)
    .eq('date', date)

  if (error) throw new Error(getDataErrorMessage(error))
  return data ?? []
}

export async function listAttendanceForStudent(studentId: string): Promise<AttendanceWithCourse[]> {
  const { data, error } = await supabase
    .from('attendance')
    .select('*, courses(grade, group_name)')
    .eq('student_id', studentId)
    .order('date', { ascending: false })

  if (error) throw new Error(getDataErrorMessage(error))
  return (data ?? []) as AttendanceWithCourse[]
}

export async function saveAttendanceBatch(records: AttendanceInput[]): Promise<void> {
  if (records.length === 0) return

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { error } = await supabase
    .from('attendance')
    .upsert(
      records.map((r) => ({ ...r, recorded_by: user?.id ?? null })),
      { onConflict: 'student_id,date' },
    )

  if (error) throw new Error(getDataErrorMessage(error))
}
