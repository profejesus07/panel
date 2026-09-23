import { supabase } from '@/lib/supabase'
import type { Tables, TablesInsert } from '@/types/database.types'
import { getDataErrorMessage } from '@/utils/errors'

export type GradeEntry = Tables<'grade_entries'>
export type GradeEntryInput = Omit<
  TablesInsert<'grade_entries'>,
  'id' | 'created_at' | 'updated_at' | 'created_by'
>

export interface GradeEntryFilters {
  studentIds: string[]
  subjectId: string
  periodId: string
}

// Notas parciales de varios estudiantes (normalmente todo un curso) para una
// asignatura y un período.
export async function listGradeEntries(filters: GradeEntryFilters): Promise<GradeEntry[]> {
  if (filters.studentIds.length === 0) return []

  const { data, error } = await supabase
    .from('grade_entries')
    .select('*')
    .in('student_id', filters.studentIds)
    .eq('subject_id', filters.subjectId)
    .eq('period_id', filters.periodId)
    .order('graded_at')
    .order('created_at')

  if (error) throw new Error(getDataErrorMessage(error))
  return data ?? []
}

// Todas las notas parciales de un estudiante (portales de estudiante y padre).
export async function listGradeEntriesForStudent(studentId: string): Promise<GradeEntry[]> {
  const { data, error } = await supabase
    .from('grade_entries')
    .select('*')
    .eq('student_id', studentId)
    .order('graded_at')
    .order('created_at')

  if (error) throw new Error(getDataErrorMessage(error))
  return data ?? []
}

export async function createGradeEntry(input: GradeEntryInput): Promise<GradeEntry> {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('grade_entries')
    .insert({ ...input, created_by: user?.id ?? null })
    .select()
    .single()

  if (error) throw new Error(getDataErrorMessage(error))
  return data
}

export async function updateGradeEntry(id: string, input: Partial<GradeEntryInput>): Promise<GradeEntry> {
  const { data, error } = await supabase
    .from('grade_entries')
    .update(input)
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(getDataErrorMessage(error))
  return data
}

export async function deleteGradeEntry(id: string): Promise<void> {
  const { error } = await supabase.from('grade_entries').delete().eq('id', id)
  if (error) throw new Error(getDataErrorMessage(error))
}

export type FinalGradeMethod = 'promedio' | 'ponderado' | 'mixto'

export interface FinalGrade {
  score: number
  method: FinalGradeMethod
  weightTotal: number
  // Porcentaje que recibe cada nota sin porcentaje en el cálculo mixto.
  unweightedShare: number | null
}

// Misma regla que public.recompute_grade (migración 0024), para mostrar la
// nota final en vivo sin esperar al servidor:
//   - ninguna nota con porcentaje  → promedio simple
//   - todas con porcentaje         → promedio ponderado
//   - mezcla                       → las notas sin porcentaje se reparten en
//                                    partes iguales lo que falta para 100 %
export function computeFinalGrade(entries: Pick<GradeEntry, 'score' | 'weight'>[]): FinalGrade | null {
  if (entries.length === 0) return null

  const weighted = entries.filter((e) => e.weight !== null)
  const unweighted = entries.filter((e) => e.weight === null)
  const weightTotal = weighted.reduce((sum, e) => sum + (e.weight ?? 0), 0)
  const weightedSum = weighted.reduce((sum, e) => sum + e.score * (e.weight ?? 0), 0)
  const unweightedSum = unweighted.reduce((sum, e) => sum + e.score, 0)

  let score: number
  let method: FinalGradeMethod
  let unweightedShare: number | null = null

  if (weighted.length === 0) {
    score = unweightedSum / unweighted.length
    method = 'promedio'
  } else if (unweighted.length === 0) {
    score = weightedSum / weightTotal
    method = 'ponderado'
  } else {
    const share = Math.max(100 - weightTotal, 0) / unweighted.length
    unweightedShare = share
    method = 'mixto'
    score =
      share === 0
        ? weightedSum / weightTotal
        : (weightedSum + share * unweightedSum) / (weightTotal + share * unweighted.length)
  }

  return { score: Math.round(score * 100) / 100, method, weightTotal, unweightedShare }
}

export function formatScore(score: number): string {
  return score.toLocaleString('es-CO', { minimumFractionDigits: 1, maximumFractionDigits: 2 })
}
