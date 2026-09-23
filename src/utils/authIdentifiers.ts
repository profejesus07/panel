import type { Enums } from '@/types/database.types'

// Supabase Auth solo identifica cuentas por correo — para que estudiantes y
// padres inicien sesión con un simple "usuario" (sin tener ni necesitar un
// correo real), cada uno recibe un correo sintético en un dominio reservado
// que nunca se muestra en la interfaz ni se usa para enviar nada. El admin
// sigue usando su correo real sin cambios.
export function studentAuthEmail(username: string): string {
  return `${username.trim().toLowerCase()}@estudiantes.local`
}

export function guardianAuthEmail(username: string): string {
  return `${username.trim().toLowerCase()}@padres.local`
}

// El código estudiantil ya es único en la base de datos, así que sirve tal
// cual como usuario. El documento del acudiente solo es único combinado con
// su tipo (una cédula y una cédula de extranjería podrían coincidir en
// número), así que el usuario junta ambos.
export function guardianUsername(documentType: Enums<'document_type'>, documentNumber: string): string {
  return `${documentType}${documentNumber}`
}
