import type { ImportRowResult } from '@/components/admin/ExcelImportModal'
import { createStudent, type StudentInput } from '@/services/students.service'
import { createUserAccount, generateTemporaryPassword } from '@/services/userAccounts.service'
import type { Course } from '@/services/courses.service'
import type { Enums } from '@/types/database.types'
import { isValidEmail } from '@/utils/validation'

export const STUDENT_IMPORT_HEADERS = [
  'Nombres',
  'Apellidos',
  'Tipo de documento',
  'Número de documento',
  'Fecha de nacimiento',
  'Género',
  'Código estudiantil',
  'Grado',
  'Grupo',
  'Año lectivo',
  'Dirección',
  'Teléfono',
  'Correo',
  'Correo de acceso',
]

export const STUDENT_IMPORT_EXAMPLE = [
  {
    Nombres: 'Juan David',
    Apellidos: 'Pérez Gómez',
    'Tipo de documento': 'TI',
    'Número de documento': '1002345678',
    'Fecha de nacimiento': '2012-05-14',
    Género: 'masculino',
    'Código estudiantil': 'EST-0001',
    Grado: '6°',
    Grupo: 'A',
    'Año lectivo': '2026',
    Dirección: 'Calle 10 # 5-20',
    Teléfono: '3001234567',
    Correo: 'juan.perez@correo.com',
    'Correo de acceso': '',
  },
]

export const STUDENT_IMPORT_INSTRUCTIONS = [
  'Los campos Nombres, Apellidos, Tipo de documento, Número de documento, Fecha de nacimiento y Código estudiantil son obligatorios.',
  'Tipo de documento debe ser uno de: RC, TI, CC, CE, PA.',
  'Fecha de nacimiento en formato AAAA-MM-DD (ej. 2012-05-14).',
  'Grado, Grupo y Año lectivo son opcionales, pero si los incluyes deben coincidir exactamente con un curso ya creado en Cursos.',
  'Si llenas "Correo de acceso", se creará automáticamente una cuenta de acceso para el estudiante con una contraseña generada (se descarga al final de la importación). Déjalo vacío si no quieres crear acceso todavía.',
]

const VALID_DOCUMENT_TYPES: Enums<'document_type'>[] = ['RC', 'TI', 'CC', 'CE', 'PA']
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/

export interface StudentImportRow {
  input: StudentInput
  accessEmail: string | null
}

export function createStudentRowParser(courses: Course[]) {
  return async function parseStudentRow(
    raw: Record<string, string>,
  ): Promise<{ ok: true; data: StudentImportRow } | { ok: false; error: string }> {
    const firstName = raw['Nombres']?.trim()
    const lastName = raw['Apellidos']?.trim()
    const documentType = raw['Tipo de documento']?.trim().toUpperCase()
    const documentNumber = raw['Número de documento']?.trim()
    const birthDate = raw['Fecha de nacimiento']?.trim()
    const gender = raw['Género']?.trim().toLowerCase()
    const studentCode = raw['Código estudiantil']?.trim()
    const grade = raw['Grado']?.trim()
    const group = raw['Grupo']?.trim()
    const academicYear = raw['Año lectivo']?.trim()
    const accessEmail = raw['Correo de acceso']?.trim()

    if (!firstName) return { ok: false, error: 'Falta el nombre.' }
    if (!lastName) return { ok: false, error: 'Falta el apellido.' }
    if (!VALID_DOCUMENT_TYPES.includes(documentType as Enums<'document_type'>)) {
      return { ok: false, error: 'Tipo de documento inválido (usa RC, TI, CC, CE o PA).' }
    }
    if (!documentNumber) return { ok: false, error: 'Falta el número de documento.' }
    if (!DATE_REGEX.test(birthDate)) {
      return { ok: false, error: 'Fecha de nacimiento inválida (usa AAAA-MM-DD).' }
    }
    if (!studentCode) return { ok: false, error: 'Falta el código estudiantil.' }
    if (gender && !['masculino', 'femenino', 'otro'].includes(gender)) {
      return { ok: false, error: 'Género inválido (usa masculino, femenino u otro, o déjalo vacío).' }
    }
    if (accessEmail && !isValidEmail(accessEmail)) {
      return { ok: false, error: 'El correo de acceso no es válido.' }
    }

    let courseId: string | null = null
    if (grade || group || academicYear) {
      if (!grade || !group || !academicYear) {
        return {
          ok: false,
          error: 'Si indicas Grado, Grupo o Año lectivo, debes completar los tres.',
        }
      }
      const match = courses.find(
        (c) => c.grade === grade && c.group_name === group && c.academic_year === academicYear,
      )
      if (!match) {
        return {
          ok: false,
          error: `No existe un curso "${grade} - ${group}" para el año ${academicYear}. Créalo primero en Cursos.`,
        }
      }
      courseId = match.id
    }

    return {
      ok: true,
      data: {
        input: {
          first_name: firstName,
          last_name: lastName,
          document_type: documentType as Enums<'document_type'>,
          document_number: documentNumber,
          birth_date: birthDate,
          gender: gender || null,
          address: raw['Dirección']?.trim() || null,
          phone: raw['Teléfono']?.trim() || null,
          email: raw['Correo']?.trim() || null,
          student_code: studentCode,
          status: 'activo',
          course_id: courseId,
          enrollment_date: new Date().toISOString().slice(0, 10),
          notes: null,
        },
        accessEmail: accessEmail || null,
      },
    }
  }
}

export interface StudentImportCredential {
  fullName: string
  email: string
  password: string
}

export async function bulkImportStudents(
  rows: StudentImportRow[],
  onCredential: (credential: StudentImportCredential) => void,
): Promise<ImportRowResult[]> {
  const results: ImportRowResult[] = []

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const rowNumber = i + 2

    try {
      const student = await createStudent(row.input)

      if (row.accessEmail) {
        const password = generateTemporaryPassword()
        try {
          await createUserAccount({
            email: row.accessEmail,
            password,
            fullName: `${row.input.first_name} ${row.input.last_name}`,
            role: 'estudiante',
            linkId: student.id,
          })
          onCredential({
            fullName: `${row.input.first_name} ${row.input.last_name}`,
            email: row.accessEmail,
            password,
          })
          results.push({ rowNumber, ok: true, message: 'Estudiante y acceso creados.' })
        } catch (accessError) {
          results.push({
            rowNumber,
            ok: true,
            message: `Estudiante creado, pero no se pudo crear el acceso: ${
              accessError instanceof Error ? accessError.message : 'error desconocido'
            }`,
          })
        }
      } else {
        results.push({ rowNumber, ok: true })
      }
    } catch (error) {
      results.push({
        rowNumber,
        ok: false,
        message: error instanceof Error ? error.message : 'No se pudo crear el estudiante.',
      })
    }
  }

  return results
}
