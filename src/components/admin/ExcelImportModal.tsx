import { AlertCircle, CheckCircle2, Download, FileSpreadsheet, Upload, XCircle } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Spinner } from '@/components/ui/Spinner'
import { downloadExcelTemplate, parseExcelFile } from '@/utils/excel'

export interface ImportRowResult {
  rowNumber: number
  ok: boolean
  message?: string
}

interface ParsedRow<T> {
  rowNumber: number
  raw: Record<string, string>
  data: T | null
  error: string | null
}

interface ExcelImportModalProps<T> {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  templateFilename: string
  templateHeaders: string[]
  templateExample: Record<string, string | number>[]
  instructions?: string[]
  parseRow: (raw: Record<string, string>, rowNumber: number) => Promise<{ ok: true; data: T } | { ok: false; error: string }>
  onImport: (rows: T[]) => Promise<ImportRowResult[]>
  renderDone?: (results: ImportRowResult[]) => ReactNode
}

type Status = 'idle' | 'parsing' | 'preview' | 'importing' | 'done'

export function ExcelImportModal<T>({
  open,
  onClose,
  title,
  description,
  templateFilename,
  templateHeaders,
  templateExample,
  instructions,
  parseRow,
  onImport,
  renderDone,
}: ExcelImportModalProps<T>) {
  const [status, setStatus] = useState<Status>('idle')
  const [rows, setRows] = useState<ParsedRow<T>[]>([])
  const [results, setResults] = useState<ImportRowResult[]>([])
  const [fileError, setFileError] = useState<string | null>(null)

  function reset() {
    setStatus('idle')
    setRows([])
    setResults([])
    setFileError(null)
  }

  function handleClose() {
    reset()
    onClose()
  }

  async function handleFile(file: File | undefined) {
    if (!file) return
    setFileError(null)
    setStatus('parsing')

    try {
      const rawRows = await parseExcelFile(file)
      if (rawRows.length === 0) {
        setFileError('El archivo no tiene filas de datos.')
        setStatus('idle')
        return
      }

      const parsed: ParsedRow<T>[] = []
      for (let i = 0; i < rawRows.length; i++) {
        const rowNumber = i + 2 // fila 1 = encabezados
        const result = await parseRow(rawRows[i], rowNumber)
        parsed.push({
          rowNumber,
          raw: rawRows[i],
          data: result.ok ? result.data : null,
          error: result.ok ? null : result.error,
        })
      }

      setRows(parsed)
      setStatus('preview')
    } catch {
      setFileError('No se pudo leer el archivo. Verifica que sea un .xlsx válido.')
      setStatus('idle')
    }
  }

  async function handleConfirmImport() {
    const validRows = rows.filter((r) => r.data !== null).map((r) => r.data as T)
    if (validRows.length === 0) return

    setStatus('importing')
    try {
      const importResults = await onImport(validRows)
      setResults(importResults)
      setStatus('done')
    } catch {
      setFileError('Ocurrió un error al importar. Inténtalo de nuevo.')
      setStatus('preview')
    }
  }

  const validCount = rows.filter((r) => r.data !== null).length
  const invalidCount = rows.length - validCount
  const successCount = results.filter((r) => r.ok).length
  const failedCount = results.length - successCount

  return (
    <Modal open={open} onClose={handleClose} title={title} description={description} size="xl">
      <div className="space-y-5">
        {status === 'idle' && (
          <>
            {instructions && instructions.length > 0 && (
              <div className="rounded-lg border border-brand-200 bg-brand-50 p-4 text-sm text-brand-800">
                <ul className="list-inside list-disc space-y-1">
                  {instructions.map((note) => (
                    <li key={note}>{note}</li>
                  ))}
                </ul>
              </div>
            )}

            <Button
              variant="outline"
              onClick={() => downloadExcelTemplate(templateFilename, templateHeaders, templateExample)}
            >
              <Download className="h-4 w-4" />
              Descargar plantilla
            </Button>

            <label
              htmlFor="excel-import-file"
              className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-neutral-300 px-6 py-10 text-center hover:border-brand-400 hover:bg-brand-50/40"
            >
              <FileSpreadsheet className="h-8 w-8 text-neutral-400" />
              <span className="text-sm font-medium text-neutral-700">
                Haz clic para subir tu archivo Excel
              </span>
              <span className="text-xs text-neutral-500">.xlsx o .xls, basado en la plantilla</span>
              <input
                id="excel-import-file"
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={(e) => void handleFile(e.target.files?.[0])}
              />
            </label>

            {fileError && (
              <div className="flex items-center gap-2 rounded-lg border border-danger-200 bg-danger-50 px-3.5 py-3 text-sm text-danger-600">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {fileError}
              </div>
            )}
          </>
        )}

        {status === 'parsing' && (
          <div className="flex flex-col items-center gap-3 py-12">
            <Spinner className="h-7 w-7" />
            <p className="text-sm text-neutral-500">Leyendo y validando el archivo...</p>
          </div>
        )}

        {status === 'preview' && (
          <>
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="success">{validCount} válidas</Badge>
              {invalidCount > 0 && <Badge variant="danger">{invalidCount} con errores</Badge>}
              <Button variant="ghost" size="sm" onClick={reset} className="ml-auto">
                Subir otro archivo
              </Button>
            </div>

            <div className="max-h-96 overflow-auto rounded-lg border border-neutral-200">
              <table className="w-full min-w-full text-left text-sm">
                <thead className="sticky top-0 bg-neutral-50">
                  <tr>
                    <th className="px-3 py-2 text-xs font-semibold uppercase text-neutral-500">Fila</th>
                    {templateHeaders.map((h) => (
                      <th key={h} className="whitespace-nowrap px-3 py-2 text-xs font-semibold uppercase text-neutral-500">
                        {h}
                      </th>
                    ))}
                    <th className="px-3 py-2 text-xs font-semibold uppercase text-neutral-500">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {rows.map((row) => (
                    <tr key={row.rowNumber} className={row.error ? 'bg-danger-50/40' : undefined}>
                      <td className="px-3 py-2 text-neutral-400">{row.rowNumber}</td>
                      {templateHeaders.map((h) => (
                        <td key={h} className="whitespace-nowrap px-3 py-2 text-neutral-700">
                          {row.raw[h] || '—'}
                        </td>
                      ))}
                      <td className="px-3 py-2">
                        {row.error ? (
                          <span className="inline-flex items-center gap-1 text-xs text-danger-600">
                            <XCircle className="h-3.5 w-3.5" />
                            {row.error}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-success-600">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Lista
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end gap-3 border-t border-neutral-200 pt-4">
              <Button variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
              <Button onClick={() => void handleConfirmImport()} disabled={validCount === 0}>
                <Upload className="h-4 w-4" />
                Importar {validCount} {validCount === 1 ? 'fila' : 'filas'}
              </Button>
            </div>
          </>
        )}

        {status === 'importing' && (
          <div className="flex flex-col items-center gap-3 py-12">
            <Spinner className="h-7 w-7" />
            <p className="text-sm text-neutral-500">Importando...</p>
          </div>
        )}

        {status === 'done' && (
          <>
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="success">{successCount} importadas</Badge>
              {failedCount > 0 && <Badge variant="danger">{failedCount} fallidas</Badge>}
              {invalidCount > 0 && <Badge variant="neutral">{invalidCount} omitidas (con errores)</Badge>}
            </div>

            {failedCount > 0 && (
              <div className="max-h-48 overflow-auto rounded-lg border border-danger-200 bg-danger-50 p-3 text-sm text-danger-700">
                {results
                  .filter((r) => !r.ok)
                  .map((r) => (
                    <p key={r.rowNumber}>
                      Fila {r.rowNumber}: {r.message ?? 'No se pudo importar.'}
                    </p>
                  ))}
              </div>
            )}

            {renderDone?.(results)}

            <div className="flex justify-end border-t border-neutral-200 pt-4">
              <Button onClick={handleClose}>Cerrar</Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  )
}
