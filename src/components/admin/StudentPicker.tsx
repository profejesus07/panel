import { Search, UserRound, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Input } from '@/components/ui/Input'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { useToast } from '@/hooks/useToast'
import { listStudents, studentFullName, type StudentWithCourse } from '@/services/students.service'

interface StudentPickerProps {
  value: StudentWithCourse | null
  onChange: (student: StudentWithCourse | null) => void
  label?: string
  placeholder?: string
}

export function StudentPicker({
  value,
  onChange,
  label = 'Estudiante',
  placeholder = 'Busca por nombre, documento o código...',
}: StudentPickerProps) {
  const { showToast } = useToast()
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search)
  const [results, setResults] = useState<StudentWithCourse[]>([])

  useEffect(() => {
    if (!debouncedSearch.trim()) return

    let active = true
    listStudents({ search: debouncedSearch, pageSize: 8 })
      .then((result) => {
        if (active) setResults(result.data)
      })
      .catch(() => {
        if (active) showToast('error', 'No se pudo buscar estudiantes.')
      })
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch])

  const visibleResults = debouncedSearch.trim() ? results : []

  if (value) {
    return (
      <div>
        {label && <p className="mb-1.5 block text-sm font-medium text-neutral-700">{label}</p>}
        <div className="flex items-center justify-between rounded-lg border border-neutral-300 bg-neutral-50 px-3.5 py-2.5">
          <div className="flex items-center gap-2 text-sm">
            <UserRound className="h-4 w-4 text-neutral-400" />
            <span className="font-medium text-neutral-900">{studentFullName(value)}</span>
            <span className="text-neutral-400">· {value.student_code}</span>
          </div>
          <button
            type="button"
            onClick={() => {
              onChange(null)
              setSearch('')
            }}
            className="rounded-md p-1 text-neutral-400 hover:bg-neutral-200 hover:text-neutral-600"
            aria-label="Cambiar estudiante"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
        <Input
          label={label}
          placeholder={placeholder}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>
      {visibleResults.length > 0 && (
        <ul className="mt-2 max-h-48 divide-y divide-neutral-200 overflow-y-auto rounded-lg border border-neutral-200">
          {visibleResults.map((s) => (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => {
                  onChange(s)
                  setSearch('')
                  setResults([])
                }}
                className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm hover:bg-neutral-50"
              >
                <span>
                  {studentFullName(s)} <span className="text-neutral-400">· {s.student_code}</span>
                </span>
                {s.courses && <span className="text-xs text-neutral-400">{s.courses.grade}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
