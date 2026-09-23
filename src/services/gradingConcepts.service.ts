import { supabase } from '@/lib/supabase'
import type { Tables, TablesInsert, TablesUpdate } from '@/types/database.types'
import { getDataErrorMessage } from '@/utils/errors'

export type GradingConcept = Tables<'grading_concepts'>
export type GradingConceptInput = Omit<
  TablesInsert<'grading_concepts'>,
  'id' | 'created_at' | 'updated_at' | 'created_by' | 'position'
>

export interface GradingConceptFilters {
  courseId: string
  subjectId: string
  periodId: string
}

// Actividades configuradas para un curso + asignatura + período (p. ej.
// Taller 1, Examen final), ordenadas por posición de creación.
export async function listGradingConcepts(filters: GradingConceptFilters): Promise<GradingConcept[]> {
  const { data, error } = await supabase
    .from('grading_concepts')
    .select('*')
    .eq('course_id', filters.courseId)
    .eq('subject_id', filters.subjectId)
    .eq('period_id', filters.periodId)
    .order('position')
    .order('created_at')

  if (error) throw new Error(getDataErrorMessage(error))
  return data ?? []
}

export async function createGradingConcept(input: GradingConceptInput): Promise<GradingConcept> {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { count } = await supabase
    .from('grading_concepts')
    .select('id', { count: 'exact', head: true })
    .eq('course_id', input.course_id)
    .eq('subject_id', input.subject_id)
    .eq('period_id', input.period_id)

  const { data, error } = await supabase
    .from('grading_concepts')
    .insert({ ...input, position: count ?? 0, created_by: user?.id ?? null })
    .select()
    .single()

  if (error) throw new Error(getDataErrorMessage(error))
  return data
}

export async function updateGradingConcept(
  id: string,
  input: TablesUpdate<'grading_concepts'>,
): Promise<GradingConcept> {
  const { data, error } = await supabase
    .from('grading_concepts')
    .update(input)
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(getDataErrorMessage(error))
  return data
}

// Al borrar una actividad, las notas que se hayan registrado sobre ella no
// se eliminan: quedan como notas libres (concept_id queda en null, texto y
// porcentaje se conservan tal como estaban).
export async function deleteGradingConcept(id: string): Promise<void> {
  const { error } = await supabase.from('grading_concepts').delete().eq('id', id)
  if (error) throw new Error(getDataErrorMessage(error))
}

export function gradingConceptsWeightTotal(concepts: Pick<GradingConcept, 'weight'>[]): number {
  return concepts.reduce((sum, c) => sum + (c.weight ?? 0), 0)
}
