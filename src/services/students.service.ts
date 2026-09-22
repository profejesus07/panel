import { supabase } from '@/lib/supabase'
import type { PaginationParams, ListResult } from '@/types/common'
import { DEFAULT_PAGE_SIZE } from '@/types/common'
import type { Tables, TablesInsert, TablesUpdate } from '@/types/database.types'
import { getDataErrorMessage } from '@/utils/errors'

export type Student = Tables<'students'>
export type StudentInput = Omit<TablesInsert<'students'>, 'id' | 'created_at' | 'updated_at'>
export type StudentUpdate = TablesUpdate<'students'>

export interface StudentWithCourse extends Student {
  courses: Pick<Tables<'courses'>, 'grade' | 'group_name'> | null
}

export interface ListStudentsParams extends PaginationParams {
  search?: string
  courseId?: string
  status?: Student['status']
}

const STUDENT_SELECT = '*, courses(grade, group_name)'

export async function listStudents(
  params: ListStudentsParams = {},
): Promise<ListResult<StudentWithCourse>> {
  const { page = 1, pageSize = DEFAULT_PAGE_SIZE, search, courseId, status } = params
  let query = supabase.from('students').select(STUDENT_SELECT, { count: 'exact' })

  if (search) {
    const term = search.trim()
    query = query.or(
      `first_name.ilike.%${term}%,last_name.ilike.%${term}%,document_number.ilike.%${term}%,student_code.ilike.%${term}%`,
    )
  }
  if (courseId) query = query.eq('course_id', courseId)
  if (status) query = query.eq('status', status)

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const { data, error, count } = await query
    .order('last_name')
    .order('first_name')
    .range(from, to)

  if (error) throw new Error(getDataErrorMessage(error))
  return { data: (data ?? []) as StudentWithCourse[], count: count ?? 0 }
}

export async function getStudent(id: string): Promise<StudentWithCourse> {
  const { data, error } = await supabase
    .from('students')
    .select(STUDENT_SELECT)
    .eq('id', id)
    .single()

  if (error) throw new Error(getDataErrorMessage(error))
  return data as StudentWithCourse
}

export async function getStudentByCode(studentCode: string): Promise<Student | null> {
  const { data, error } = await supabase
    .from('students')
    .select('*')
    .eq('student_code', studentCode)
    .maybeSingle()

  if (error) throw new Error(getDataErrorMessage(error))
  return data
}

export async function createStudent(input: StudentInput): Promise<Student> {
  const { data, error } = await supabase.from('students').insert(input).select().single()
  if (error) throw new Error(getDataErrorMessage(error))
  return data
}

export async function updateStudent(id: string, input: StudentUpdate): Promise<Student> {
  const { data, error } = await supabase
    .from('students')
    .update(input)
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(getDataErrorMessage(error))
  return data
}

export async function deleteStudent(id: string): Promise<void> {
  const { error } = await supabase.from('students').delete().eq('id', id)
  if (error) throw new Error(getDataErrorMessage(error))
}

export function studentFullName(student: Pick<Student, 'first_name' | 'last_name'>): string {
  return `${student.first_name} ${student.last_name}`
}
