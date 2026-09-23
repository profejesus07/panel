import { supabase } from '@/lib/supabase'
import type { Tables } from '@/types/database.types'
import { getDataErrorMessage } from '@/utils/errors'

export type PerformanceLevel = Tables<'performance_levels'>

export interface PerformanceLevelUpdate {
  id: string
  name: string
  min_score: number
  max_score: number
}

// Colores fijos por nivel (rojo → amarillo → azul → verde, de menor a mayor
// desempeño). El slug es estable aunque el admin renombre o reajuste los
// rangos, así que sirve como llave para el color sin depender del nombre.
export const PERFORMANCE_LEVEL_COLORS: Record<
  string,
  { badge: 'danger' | 'warning' | 'info' | 'success'; hex: string; bar: string; dot: string }
> = {
  bajo: { badge: 'danger', hex: '#ef4444', bar: 'bg-danger-500', dot: 'bg-danger-500' },
  basico: { badge: 'warning', hex: '#f59e0b', bar: 'bg-warning-500', dot: 'bg-warning-500' },
  alto: { badge: 'info', hex: '#3b82f6', bar: 'bg-info-500', dot: 'bg-info-500' },
  superior: { badge: 'success', hex: '#22c55e', bar: 'bg-success-500', dot: 'bg-success-500' },
}

const DEFAULT_COLOR = { badge: 'neutral' as const, hex: '#94a3b8', bar: 'bg-neutral-400', dot: 'bg-neutral-400' }

export function performanceLevelColor(slug: string) {
  return PERFORMANCE_LEVEL_COLORS[slug] ?? DEFAULT_COLOR
}

export async function listPerformanceLevels(): Promise<PerformanceLevel[]> {
  const { data, error } = await supabase
    .from('performance_levels')
    .select('*')
    .order('sort_order')

  if (error) throw new Error(getDataErrorMessage(error))
  return data ?? []
}

export async function updatePerformanceLevels(
  updates: PerformanceLevelUpdate[],
): Promise<PerformanceLevel[]> {
  const results = await Promise.all(
    updates.map(async (update) => {
      const { data, error } = await supabase
        .from('performance_levels')
        .update({ name: update.name, min_score: update.min_score, max_score: update.max_score })
        .eq('id', update.id)
        .select()
        .single()

      if (error) throw new Error(getDataErrorMessage(error))
      return data
    }),
  )

  return results.sort((a, b) => a.sort_order - b.sort_order)
}

export function findPerformanceLevel(
  score: number,
  levels: PerformanceLevel[],
): PerformanceLevel | null {
  if (levels.length === 0) return null

  const match = levels.find((level) => score >= level.min_score && score <= level.max_score)
  if (match) return match

  // Fuera de todos los rangos (p. ej. un puntaje mayor al máximo configurado):
  // se asigna al nivel más cercano en vez de dejarlo sin clasificar.
  const sorted = [...levels].sort((a, b) => a.min_score - b.min_score)
  return score < sorted[0].min_score ? sorted[0] : sorted[sorted.length - 1]
}
