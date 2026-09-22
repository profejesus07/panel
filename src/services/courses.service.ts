import { supabase } from '@/lib/supabase'
import type { PaginationParams, ListResult } from '@/types/common'
import { DEFAULT_PAGE_SIZE } from '@/types/common'
import type { Tables, TablesInsert, TablesUpdate } from '@/types/database.types'
import { getDataErrorMessage } from '@/utils/errors'

export type Course = Tables<'courses'>
export type CourseInput = Omit<TablesInsert<'courses'>, 'id' | 'created_at' | 'updated_at'>
export type CourseUpdate = TablesUpdate<'courses'>

export interface ListCoursesParams extends PaginationParams {
  search?: string
  academicYear?: string
  status?: Course['status']
}

export async function listCourses(params: ListCoursesParams = {}): Promise<ListResult<Course>> {
  const { page = 1, pageSize = DEFAULT_PAGE_SIZE, search, academicYear, status } = params
  let query = supabase.from('courses').select('*', { count: 'exact' })

  if (search) query = query.or(`grade.ilike.%${search}%,group_name.ilike.%${search}%`)
  if (academicYear) query = query.eq('academic_year', academicYear)
  if (status) query = query.eq('status', status)

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const { data, error, count } = await query
    .order('academic_year', { ascending: false })
    .order('grade')
    .order('group_name')
    .range(from, to)

  if (error) throw new Error(getDataErrorMessage(error))
  return { data: data ?? [], count: count ?? 0 }
}

export async function listActiveCourses(): Promise<Course[]> {
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .eq('status', 'activo')
    .order('academic_year', { ascending: false })
    .order('grade')
    .order('group_name')

  if (error) throw new Error(getDataErrorMessage(error))
  return data ?? []
}

export async function createCourse(input: CourseInput): Promise<Course> {
  const { data, error } = await supabase.from('courses').insert(input).select().single()
  if (error) throw new Error(getDataErrorMessage(error))
  return data
}

export async function updateCourse(id: string, input: CourseUpdate): Promise<Course> {
  const { data, error } = await supabase
    .from('courses')
    .update(input)
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(getDataErrorMessage(error))
  return data
}

export async function deleteCourse(id: string): Promise<void> {
  const { error } = await supabase.from('courses').delete().eq('id', id)
  if (error) throw new Error(getDataErrorMessage(error))
}

export function courseLabel(course: Pick<Course, 'grade' | 'group_name'>): string {
  return `${course.grade} - ${course.group_name}`
}
