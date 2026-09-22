import { supabase } from '@/lib/supabase'
import type { AcademicPeriod } from '@/services/academicCatalog.service'
import { getActiveSchoolSettings, type SchoolSettings } from '@/services/schoolSettings.service'
import { getStudent, type StudentWithCourse } from '@/services/students.service'
import type { Enums, Tables } from '@/types/database.types'
import { getDataErrorMessage } from '@/utils/errors'
import type { GradeWithRefs } from './grades.service'

export interface StudentReportData {
  student: StudentWithCourse
  period: AcademicPeriod
  schoolSettings: SchoolSettings | null
  grades: GradeWithRefs[]
  attendanceCounts: Record<Enums<'attendance_status'>, number>
  behaviorRecords: Tables<'behavior_records'>[]
}

export async function getStudentReport(
  studentId: string,
  period: AcademicPeriod,
): Promise<StudentReportData> {
  const [student, schoolSettings, gradesResult, attendanceResult, behaviorResult] = await Promise.all([
    getStudent(studentId),
    getActiveSchoolSettings(),
    supabase
      .from('grades')
      .select('*, subjects(id, name), academic_periods(id, name, academic_year)')
      .eq('student_id', studentId)
      .eq('period_id', period.id),
    supabase
      .from('attendance')
      .select('status')
      .eq('student_id', studentId)
      .gte('date', period.start_date)
      .lte('date', period.end_date),
    supabase
      .from('behavior_records')
      .select('*')
      .eq('student_id', studentId)
      .gte('record_date', period.start_date)
      .lte('record_date', period.end_date)
      .order('record_date'),
  ])

  if (gradesResult.error) throw new Error(getDataErrorMessage(gradesResult.error))
  if (attendanceResult.error) throw new Error(getDataErrorMessage(attendanceResult.error))
  if (behaviorResult.error) throw new Error(getDataErrorMessage(behaviorResult.error))

  const attendanceCounts: Record<Enums<'attendance_status'>, number> = {
    presente: 0,
    ausente: 0,
    tarde: 0,
    justificado: 0,
  }
  for (const row of attendanceResult.data ?? []) {
    attendanceCounts[row.status] += 1
  }

  const grades = [...((gradesResult.data ?? []) as GradeWithRefs[])].sort((a, b) =>
    (a.subjects?.name ?? '').localeCompare(b.subjects?.name ?? ''),
  )

  return {
    student,
    period,
    schoolSettings,
    grades,
    attendanceCounts,
    behaviorRecords: behaviorResult.data ?? [],
  }
}
