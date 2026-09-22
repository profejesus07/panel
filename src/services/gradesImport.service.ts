import type { ImportRowResult } from '@/components/admin/ExcelImportModal'
import type { AcademicPeriod, Subject } from '@/services/academicCatalog.service'
import { upsertGrade, type GradeInput } from '@/services/grades.service'
import { getStudentByCode } from '@/services/students.service'

export const GRADE_IMPORT_HEADERS = [
  'Código del estudiante',
  'Asignatura',
  'Período',
  'Año lectivo',
  'Calificación',
  'Escala',
  'Observación',
  'Fecha',
]

export const GRADE_IMPORT_EXAMPLE = [
  {
    'Código del estudiante': 'EST-0001',
    Asignatura: 'Matemáticas',
    Período: 'Período 1',
    'Año lectivo': '2026',
    Calificación: '4.5',
    Escala: '1.0 a 5.0',
    Observación: '',
    Fecha: '',
  },
]

export const GRADE_IMPORT_INSTRUCTIONS = [
  'Código del estudiante debe coincidir con un estudiante ya creado.',
  'Asignatura debe existir tal cual en Configuración → Asignaturas.',
  'Período y Año lectivo deben coincidir con un período académico ya creado en Configuración → Períodos académicos.',
  'Escala es opcional (por defecto "1.0 a 5.0"); Fecha es opcional (por defecto hoy, formato AAAA-MM-DD).',
  'Si el estudiante ya tiene una calificación para esa asignatura y período, se actualizará en vez de duplicarse.',
]

export interface GradeImportRow {
  input: GradeInput
}

export function createGradeRowParser(subjects: Subject[], periods: AcademicPeriod[]) {
  return async function parseGradeRow(
    raw: Record<string, string>,
  ): Promise<{ ok: true; data: GradeImportRow } | { ok: false; error: string }> {
    const studentCode = raw['Código del estudiante']?.trim()
    const subjectName = raw['Asignatura']?.trim()
    const periodName = raw['Período']?.trim()
    const academicYear = raw['Año lectivo']?.trim()
    const scoreText = raw['Calificación']?.trim()
    const dateText = raw['Fecha']?.trim()

    if (!studentCode) return { ok: false, error: 'Falta el código del estudiante.' }
    if (!subjectName) return { ok: false, error: 'Falta la asignatura.' }
    if (!periodName || !academicYear) return { ok: false, error: 'Faltan Período o Año lectivo.' }
    if (!scoreText) return { ok: false, error: 'Falta la calificación.' }

    const score = Number(scoreText.replace(',', '.'))
    if (Number.isNaN(score) || score < 0) {
      return { ok: false, error: 'La calificación debe ser un número válido.' }
    }

    if (dateText && !/^\d{4}-\d{2}-\d{2}$/.test(dateText)) {
      return { ok: false, error: 'Fecha inválida (usa AAAA-MM-DD o déjala vacía).' }
    }

    const student = await getStudentByCode(studentCode)
    if (!student) {
      return { ok: false, error: `No existe ningún estudiante con código "${studentCode}".` }
    }

    const subject = subjects.find((s) => s.name.toLowerCase() === subjectName.toLowerCase())
    if (!subject) {
      return { ok: false, error: `No existe la asignatura "${subjectName}".` }
    }

    const period = periods.find(
      (p) => p.name.toLowerCase() === periodName.toLowerCase() && p.academic_year === academicYear,
    )
    if (!period) {
      return { ok: false, error: `No existe el período "${periodName}" para el año ${academicYear}.` }
    }

    return {
      ok: true,
      data: {
        input: {
          student_id: student.id,
          subject_id: subject.id,
          period_id: period.id,
          score,
          scale: raw['Escala']?.trim() || '1.0 a 5.0',
          observation: raw['Observación']?.trim() || null,
          graded_at: dateText || new Date().toISOString().slice(0, 10),
          status: 'definitiva',
        },
      },
    }
  }
}

export async function bulkImportGrades(rows: GradeImportRow[]): Promise<ImportRowResult[]> {
  const results: ImportRowResult[] = []

  for (let i = 0; i < rows.length; i++) {
    const rowNumber = i + 2
    try {
      await upsertGrade(rows[i].input)
      results.push({ rowNumber, ok: true })
    } catch (error) {
      results.push({
        rowNumber,
        ok: false,
        message: error instanceof Error ? error.message : 'No se pudo crear la calificación.',
      })
    }
  }

  return results
}
