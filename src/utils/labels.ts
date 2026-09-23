import type { Enums } from '@/types/database.types'

export const COURSE_SHIFT_LABELS: Record<Enums<'course_shift'>, string> = {
  manana: 'Mañana',
  tarde: 'Tarde',
  unica: 'Única',
  fin_de_semana: 'Fin de semana',
}

export const COURSE_STATUS_LABELS: Record<Enums<'course_status'>, string> = {
  activo: 'Activo',
  inactivo: 'Inactivo',
}

export const DOCUMENT_TYPE_LABELS: Record<Enums<'document_type'>, string> = {
  RC: 'Registro Civil',
  TI: 'Tarjeta de Identidad',
  CC: 'Cédula de Ciudadanía',
  CE: 'Cédula de Extranjería',
  PA: 'Pasaporte',
}

/** Documento para mostrar ("Tarjeta de Identidad 1002345678"); null si no hay número. */
export function formatDocument(
  type: Enums<'document_type'> | null,
  number: string | null,
): string | null {
  if (!number) return null
  return type ? `${DOCUMENT_TYPE_LABELS[type]} ${number}` : number
}

export const STUDENT_STATUS_LABELS: Record<Enums<'student_status'>, string> = {
  activo: 'Activo',
  inactivo: 'Inactivo',
  retirado: 'Retirado',
  graduado: 'Graduado',
}

export const GUARDIAN_RELATIONSHIP_LABELS: Record<Enums<'guardian_relationship'>, string> = {
  padre: 'Padre',
  madre: 'Madre',
  tutor: 'Tutor',
  acudiente: 'Acudiente',
  otro: 'Otro',
}

export const ATTENDANCE_STATUS_LABELS: Record<Enums<'attendance_status'>, string> = {
  presente: 'Presente',
  ausente: 'Ausente',
  tarde: 'Tarde',
  justificado: 'Justificado',
}

export const JUSTIFICATION_STATUS_LABELS: Record<Enums<'justification_status'>, string> = {
  pendiente: 'Pendiente',
  aprobada: 'Aprobada',
  rechazada: 'Rechazada',
}

export const GRADE_STATUS_LABELS: Record<Enums<'grade_status'>, string> = {
  borrador: 'Borrador',
  definitiva: 'Definitiva',
}

export const BEHAVIOR_RECORD_TYPE_LABELS: Record<Enums<'behavior_record_type'>, string> = {
  observacion: 'Observación',
  reconocimiento: 'Reconocimiento',
  compromiso: 'Compromiso',
  situacion_convivencia: 'Situación de convivencia',
}

export const BEHAVIOR_RECORD_STATUS_LABELS: Record<Enums<'behavior_record_status'>, string> = {
  abierto: 'Abierto',
  en_seguimiento: 'En seguimiento',
  cerrado: 'Cerrado',
}

export const OFFICIAL_RECORD_TYPE_LABELS: Record<Enums<'official_record_type'>, string> = {
  reunion: 'Reunión',
  disciplinaria: 'Disciplinaria',
  comite: 'Comité',
  graduacion: 'Graduación',
  otro: 'Otro',
}

export const OFFICIAL_RECORD_STATUS_LABELS: Record<Enums<'official_record_status'>, string> = {
  vigente: 'Vigente',
  anulada: 'Anulada',
}

export const ANNOUNCEMENT_STATUS_LABELS: Record<Enums<'announcement_status'>, string> = {
  borrador: 'Borrador',
  publicado: 'Publicado',
  archivado: 'Archivado',
}

export const AUDIENCE_SCOPE_LABELS: Record<Enums<'audience_scope'>, string> = {
  todos: 'Todos',
  estudiantes: 'Todos los estudiantes',
  padres: 'Todos los padres',
  curso: 'Un curso específico',
  estudiante: 'Un estudiante específico',
}

export const USER_ROLE_LABELS: Record<Enums<'user_role'>, string> = {
  admin: 'Administrador',
  estudiante: 'Estudiante',
  padre: 'Padre de familia',
}
