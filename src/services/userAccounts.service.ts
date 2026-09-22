import { supabase } from '@/lib/supabase'
import type { Enums } from '@/types/database.types'

export interface CreateUserAccountParams {
  email: string
  password: string
  fullName: string
  role: Extract<Enums<'user_role'>, 'estudiante' | 'padre'>
  linkId: string
}

interface CreateUserResponse {
  success: boolean
  user_id?: string
  error?: string
}

// Única forma permitida de crear una cuenta de acceso: nunca se llama a
// supabase.auth.admin desde el cliente (eso requeriría la service_role key
// en el navegador). La Edge Function valida que quien llama sea admin.
export async function createUserAccount(params: CreateUserAccountParams): Promise<string> {
  const { data, error } = await supabase.functions.invoke<CreateUserResponse>('create-user', {
    body: {
      email: params.email,
      password: params.password,
      full_name: params.fullName,
      role: params.role,
      link_id: params.linkId,
    },
  })

  if (error) {
    throw new Error('No se pudo crear la cuenta. Inténtalo de nuevo.')
  }
  if (!data?.success || !data.user_id) {
    throw new Error(data?.error ?? 'No se pudo crear la cuenta.')
  }

  return data.user_id
}

const PASSWORD_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'

export function generateTemporaryPassword(length = 12): string {
  const values = new Uint32Array(length)
  crypto.getRandomValues(values)
  return Array.from(values, (value) => PASSWORD_CHARS[value % PASSWORD_CHARS.length]).join('')
}
