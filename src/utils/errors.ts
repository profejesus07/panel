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
