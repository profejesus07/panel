export function getAuthErrorMessage(message: string): string {
  if (message.includes('Invalid login credentials')) {
    return 'Correo o contraseña incorrectos.'
  }
  if (message.includes('Email not confirmed')) {
    return 'Debes confirmar tu correo antes de iniciar sesión.'
  }
  if (message.includes('Too many requests')) {
    return 'Demasiados intentos. Espera un momento antes de volver a intentarlo.'
  }
  return 'No se pudo iniciar sesión. Inténtalo de nuevo.'
}

interface PostgrestLikeError {
  code?: string
  message?: string
}

// Traduce los errores más comunes de Postgres/PostgREST a mensajes claros en
// español. No se agotan todos los códigos posibles: cualquier otro cae en un
// mensaje genérico en vez de mostrar el detalle técnico al usuario.
export function getDataErrorMessage(error: unknown): string {
  const err = error as PostgrestLikeError | null

  switch (err?.code) {
    case '23505':
      return 'Ya existe un registro con esos datos (posible duplicado).'
    case '23503':
      return 'No se puede completar la operación porque el registro está relacionado con otra información.'
    case '23514':
      return 'Los datos no cumplen las reglas de validación del sistema.'
    case 'PGRST116':
      return 'El registro solicitado no existe o no tienes acceso a él.'
    default:
      return 'Ocurrió un error al procesar la solicitud. Inténtalo de nuevo.'
  }
}
