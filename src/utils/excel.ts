import * as XLSX from 'xlsx'

// Lee la primera hoja de un archivo .xlsx/.xls/.csv como filas de texto
// (defval: '' asegura que una celda vacía sea '' y no quede ausente, para
// que cada fila tenga siempre todas las columnas al validarla).
export async function parseExcelFile(file: File): Promise<Record<string, string>[]> {
  const buffer = await file.arrayBuffer()
  const workbook = XLSX.read(buffer, { type: 'array' })
  const firstSheetName = workbook.SheetNames[0]
  if (!firstSheetName) return []

  const sheet = workbook.Sheets[firstSheetName]
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '', raw: false })

  return rows.map((row) => {
    const normalized: Record<string, string> = {}
    for (const [key, value] of Object.entries(row)) {
      normalized[key.trim()] = String(value ?? '').trim()
    }
    return normalized
  })
}

// Genera y descarga una plantilla .xlsx con encabezados + filas de ejemplo,
// para que el usuario solo tenga que reemplazar los datos de muestra.
export function downloadExcelTemplate(
  filename: string,
  headers: string[],
  exampleRows: Record<string, string | number>[],
) {
  const worksheet = XLSX.utils.json_to_sheet(exampleRows, { header: headers })
  worksheet['!cols'] = headers.map((h) => ({ wch: Math.max(h.length + 2, 14) }))

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Plantilla')
  XLSX.writeFile(workbook, filename)
}

// Descarga un arreglo de filas como .xlsx (usado para reportes/credenciales).
export function downloadExcelData(
  filename: string,
  headers: string[],
  rows: Record<string, string | number>[],
  sheetName = 'Datos',
) {
  const worksheet = XLSX.utils.json_to_sheet(rows, { header: headers })
  worksheet['!cols'] = headers.map((h) => ({ wch: Math.max(h.length + 2, 14) }))

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)
  XLSX.writeFile(workbook, filename)
}
