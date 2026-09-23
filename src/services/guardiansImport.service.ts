import type { ImportRowResult } from '@/components/admin/ExcelImportModal'
import {
  createGuardian,
  getGuardianByDocument,
  type GuardianInput,
} from '@/services/guardians.service'
import { getStudentByCode } from '@/services/students.service'
import { createLink } from '@/services/studentGuardians.service'
import { createUserAccount, generateTemporaryPassword } from '@/services/userAccounts.service'
import { Constants, type Enums } from '@/types/database.types'
import { guardianUsername } from '@/utils/authIdentifiers'

export const GUARDIAN_IMPORT_HEADERS = [
  'Nombres',
  'Apellidos',
  'Tipo de documento',
  'Número de documento',
  'Teléfono',
  'Correo',
  'Dirección',
  'Código del estudiante',
  'Parentesco',
  'Acudiente principal',
  'Crear acceso',
]

export const GUARDIAN_IMPORT_EXAMPLE = [
  {
    Nombres: 'María Elena',
    Apellidos: 'Gómez Ruiz',
    'Tipo de documento': 'CC',
    'Número de documento': '43567890',
    Teléfono: '3009876543',
    Correo: 'maria.gomez@correo.com',
    Dirección: 'Calle 10 # 5-20',
    'Código del estudiante': 'EST-0001',
    Parentesco: 'madre',
    'Acudiente principal': 'sí',
    'Crear acceso': 'sí',
  },
]

export const GUARDIAN_IMPORT_INSTRUCTIONS = [
  'Todos los campos son obligatorios excepto Teléfono, Correo y Dirección.',
  'Código del estudiante debe coincidir con un estudiante ya creado (columna "Código estudiantil" en Estudiantes).',
  'Parentesco debe ser uno de: padre, madre, tutor, acudiente, otro.',
  'Acudiente principal: escribe "sí" o "no". Solo puede haber un acudiente principal por estudiante.',
  'Si el mismo padre/madre tiene varios hijos, agrega una fila por cada hijo repitiendo sus datos — el sistema detecta que es la misma persona (por tipo y número de documento) y no la duplica.',
  'Si escribes "sí" en "Crear acceso" (una sola vez por persona, aunque aparezca en varias filas), se creará una cuenta para que entre al panel: su usuario será su tipo y número de documento juntos, sin espacios (ej. CC43567890), con una contraseña generada, descargable al final.',
]

const VALID_DOCUMENT_TYPES: Enums<'document_type'>[] = ['RC', 'TI', 'CC', 'CE', 'PA']
const VALID_RELATIONSHIPS = Constants.public.Enums.guardian_relationship

export interface GuardianImportRow {
  guardianInput: GuardianInput
  studentId: string
  relationship: Enums<'guardian_relationship'>
  isPrimary: boolean
  createAccess: boolean
}

export async function parseGuardianRow(
  raw: Record<string, string>,
): Promise<{ ok: true; data: GuardianImportRow } | { ok: false; error: string }> {
  const firstName = raw['Nombres']?.trim()
  const lastName = raw['Apellidos']?.trim()
  const documentType = raw['Tipo de documento']?.trim().toUpperCase()
  const documentNumber = raw['Número de documento']?.trim()
  const studentCode = raw['Código del estudiante']?.trim()
  const relationship = raw['Parentesco']?.trim().toLowerCase()
  const primaryText = raw['Acudiente principal']?.trim().toLowerCase()
  const createAccessText = raw['Crear acceso']?.trim().toLowerCase()

  if (!firstName) return { ok: false, error: 'Falta el nombre.' }
  if (!lastName) return { ok: false, error: 'Falta el apellido.' }
  if (!VALID_DOCUMENT_TYPES.includes(documentType as Enums<'document_type'>)) {
    return { ok: false, error: 'Tipo de documento inválido (usa RC, TI, CC, CE o PA).' }
  }
  if (!documentNumber) return { ok: false, error: 'Falta el número de documento.' }
  if (!studentCode) return { ok: false, error: 'Falta el código del estudiante.' }
  if (!VALID_RELATIONSHIPS.includes(relationship as Enums<'guardian_relationship'>)) {
    return {
      ok: false,
      error: 'Parentesco inválido (usa padre, madre, tutor, acudiente u otro).',
    }
  }

  const student = await getStudentByCode(studentCode)
  if (!student) {
    return { ok: false, error: `No existe ningún estudiante con código "${studentCode}".` }
  }

  return {
    ok: true,
    data: {
      guardianInput: {
        first_name: firstName,
        last_name: lastName,
        document_type: documentType as Enums<'document_type'>,
        document_number: documentNumber,
        phone: raw['Teléfono']?.trim() || null,
        email: raw['Correo']?.trim() || null,
        address: raw['Dirección']?.trim() || null,
      },
      studentId: student.id,
      relationship: relationship as Enums<'guardian_relationship'>,
      isPrimary: primaryText === 'sí' || primaryText === 'si',
      createAccess: createAccessText === 'sí' || createAccessText === 'si',
    },
  }
}

export interface GuardianImportCredential {
  fullName: string
  username: string
  password: string
}

export async function bulkImportGuardians(
  rows: GuardianImportRow[],
  onCredential: (credential: GuardianImportCredential) => void,
): Promise<ImportRowResult[]> {
  const results: ImportRowResult[] = []
  const resolvedGuardianIds = new Map<string, string>()

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const rowNumber = i + 2
    const key = `${row.guardianInput.document_type}:${row.guardianInput.document_number}`

    try {
      let guardianId = resolvedGuardianIds.get(key)
      let isNewGuardian = false

      if (!guardianId) {
        const existing = await getGuardianByDocument(
          row.guardianInput.document_type,
          row.guardianInput.document_number,
        )
        if (existing) {
          guardianId = existing.id
        } else {
          const created = await createGuardian(row.guardianInput)
          guardianId = created.id
          isNewGuardian = true
        }
        resolvedGuardianIds.set(key, guardianId)
      }

      await createLink({
        student_id: row.studentId,
        guardian_id: guardianId,
        relationship: row.relationship,
        is_primary: row.isPrimary,
      })

      if (isNewGuardian && row.createAccess) {
        const password = generateTemporaryPassword()
        const username = guardianUsername(row.guardianInput.document_type, row.guardianInput.document_number)
        try {
          await createUserAccount({
            username,
            password,
            fullName: `${row.guardianInput.first_name} ${row.guardianInput.last_name}`,
            role: 'padre',
            linkId: guardianId,
          })
          onCredential({
            fullName: `${row.guardianInput.first_name} ${row.guardianInput.last_name}`,
            username,
            password,
          })
          results.push({ rowNumber, ok: true, message: 'Acudiente y acceso creados, vínculo creado.' })
        } catch (accessError) {
          results.push({
            rowNumber,
            ok: true,
            message: `Vínculo creado, pero no se pudo crear el acceso: ${
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
        message: error instanceof Error ? error.message : 'No se pudo procesar esta fila.',
      })
    }
  }

  return results
}
