import { supabase } from '@/lib/supabase'
import type { Enums } from '@/types/database.types'
import { guardianAuthEmail, studentAuthEmail } from '@/utils/authIdentifiers'

export interface CreateUserAccountParams {
  username: string
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
//
// La Edge Function sigue guardando un "email" (es lo único que entiende
// Supabase Auth), pero acá se calcula a partir del usuario para que
// estudiantes y padres nunca tengan que dar ni conocer un correo real.
export async function createUserAccount(params: CreateUserAccountParams): Promise<string> {
  const email =
    params.role === 'estudiante' ? studentAuthEmail(params.username) : guardianAuthEmail(params.username)

  const { data, error } = await supabase.functions.invoke<CreateUserResponse>('create-user', {
    body: {
      email,
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
