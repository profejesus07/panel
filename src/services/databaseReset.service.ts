import { supabase } from '@/lib/supabase'

export const RESET_CONFIRMATION_PHRASE = 'ELIMINAR TODO'

interface ResetDatabaseResponse {
  success: boolean
  deleted_users?: number
  error?: string
}

// Borra toda la información del colegio y todas las cuentas excepto la del
// admin que lo ejecuta. Lo hace la Edge Function reset-database, que es la
// única con privilegios para eliminar cuentas de acceso.
export async function resetDatabase(password: string, confirmation: string): Promise<number> {
  const { data, error } = await supabase.functions.invoke<ResetDatabaseResponse>('reset-database', {
    body: { password, confirmation },
  })

  if (error) {
    throw new Error('No se pudo eliminar la base de datos. Inténtalo de nuevo.')
  }
  if (!data?.success) {
    throw new Error(data?.error ?? 'No se pudo eliminar la base de datos.')
  }

  return data.deleted_users ?? 0
}
