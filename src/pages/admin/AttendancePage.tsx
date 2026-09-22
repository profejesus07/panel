import { CalendarCheck, Save, Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import { StudentPicker } from '@/components/admin/StudentPicker'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Skeleton } from '@/components/ui/Skeleton'
import { Table, type TableColumn } from '@/components/ui/Table'
import { Tabs } from '@/components/ui/Tabs'
import { useSimpleQuery } from '@/hooks/useSimpleQuery'
import { useToast } from '@/hooks/useToast'
import {
  listAttendanceForCourseDate,
  listAttendanceForStudent,
  saveAttendanceBatch,
  type AttendanceWithCourse,
} from '@/services/attendance.service'
import { courseLabel, listActiveCourses } from '@/services/courses.service'
import { listStudents, studentFullName, type StudentWithCourse } from '@/services/students.service'
import type { Enums } from '@/types/database.types'
import { ATTENDANCE_STATUS_LABELS } from '@/utils/labels'

type AttendanceStatus = Enums<'attendance_status'>

const STATUS_OPTIONS: { value: AttendanceStatus; short: string }[] = [
  { value: 'presente', short: 'P' },
  { value: 'ausente', short: 'A' },
  { value: 'tarde', short: 'T' },
  { value: 'justificado', short: 'J' },
]

const STATUS_BADGE_VARIANT: Record<AttendanceStatus, 'success' | 'danger' | 'warning' | 'brand'> = {
  presente: 'success',
  ausente: 'danger',
  tarde: 'warning',
  justificado: 'brand',
}

export function AttendancePage() {
  const [tab, setTab] = useState<'tomar' | 'historial'>('tomar')

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900">Asistencia</h1>
        <p className="text-sm text-neutral-500">Registro diario de asistencia por curso e historial por estudiante.</p>
      </div>

      <div className="mb-6">
        <Tabs
          tabs={[
            { key: 'tomar', label: 'Tomar asistencia' },
            { key: 'historial', label: 'Historial por estudiante' },
          ]}
          active={tab}
          onChange={(key) => setTab(key as 'tomar' | 'historial')}
        />
      </div>

      {tab === 'tomar' ? <TakeAttendanceTab /> : <StudentHistoryTab />}
    </div>
  )
}

function TakeAttendanceTab() {
  const { showToast } = useToast()
  const { data: courses } = useSimpleQuery(listActiveCourses, [], () =>
    showToast('error', 'No se pudieron cargar los cursos.'),
  )

  const [courseId, setCourseId] = useState('')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [students, setStudents] = useState<StudentWithCourse[]>([])
  const [statusMap, setStatusMap] = useState<Record<string, AttendanceStatus>>({})
  const [saving, setSaving] = useState(false)

  const [loadedKey, setLoadedKey] = useState<string | null>(null)
  const currentKey = courseId && date ? `${courseId}:${date}` : null
  const loading = Boolean(currentKey) && loadedKey !== currentKey

  useEffect(() => {
    if (!currentKey || !courseId) return

    let active = true

    Promise.all([
      listStudents({ courseId, status: 'activo', pageSize: 200 }),
      listAttendanceForCourseDate(courseId, date),
    ])
      .then(([studentsResult, attendanceResult]) => {
        if (!active) return
        setStudents(studentsResult.data)
        const map: Record<string, AttendanceStatus> = {}
        for (const student of studentsResult.data) {
          const existing = attendanceResult.find((a) => a.student_id === student.id)
          map[student.id] = existing?.status ?? 'presente'
        }
        setStatusMap(map)
        setLoadedKey(currentKey)
      })
      .catch(() => {
        if (!active) return
        showToast('error', 'No se pudo cargar la asistencia del curso.')
        setLoadedKey(currentKey)
      })

    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentKey])

  async function handleSave() {
    if (!courseId) return

    setSaving(true)
    try {
      await saveAttendanceBatch(
        students.map((student) => ({
          student_id: student.id,
          course_id: courseId,
          date,
          status: statusMap[student.id] ?? 'presente',
        })),
      )
      showToast('success', 'Asistencia guardada correctamente.')
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : 'No se pudo guardar la asistencia.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end">
        <Select label="Curso" value={courseId} onChange={(e) => setCourseId(e.target.value)} className="sm:w-64">
          <option value="">Selecciona un curso</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {courseLabel(c)} ({c.academic_year})
            </option>
          ))}
        </Select>
        <Input
          label="Fecha"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="sm:w-48"
        />
        {courseId && students.length > 0 && (
          <Button onClick={() => void handleSave()} loading={saving} className="sm:ml-auto">
            <Save className="h-4 w-4" />
            Guardar asistencia
          </Button>
        )}
      </div>

      {!courseId ? (
        <EmptyState
          icon={Users}
          title="Selecciona un curso"
          description="Elige un curso y una fecha para tomar la asistencia."
        />
      ) : loading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : students.length === 0 ? (
        <EmptyState title="Sin estudiantes activos en este curso" />
      ) : (
        <ul className="divide-y divide-neutral-200 rounded-xl border border-neutral-200 bg-white">
          {students.map((student) => (
            <li key={student.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-neutral-900">{studentFullName(student)}</p>
                <p className="text-xs text-neutral-500">{student.student_code}</p>
              </div>
              <div className="flex gap-1.5">
                {STATUS_OPTIONS.map((option) => {
                  const selected = statusMap[student.id] === option.value
                  return (
                    <button
                      key={option.value}
                      type="button"
                      title={ATTENDANCE_STATUS_LABELS[option.value]}
                      onClick={() =>
                        setStatusMap((prev) => ({ ...prev, [student.id]: option.value }))
                      }
                      className={
                        selected
                          ? `flex h-9 w-9 items-center justify-center rounded-lg text-sm font-semibold text-white ${
                              option.value === 'presente'
                                ? 'bg-success-600'
                                : option.value === 'ausente'
                                  ? 'bg-danger-600'
                                  : option.value === 'tarde'
                                    ? 'bg-warning-500'
                                    : 'bg-brand-700'
                            }`
                          : 'flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-300 text-sm font-semibold text-neutral-500 hover:bg-neutral-50'
                      }
                    >
                      {option.short}
                    </button>
                  )
                })}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function StudentHistoryTab() {
  const { showToast } = useToast()
  const [student, setStudent] = useState<StudentWithCourse | null>(null)
  const [records, setRecords] = useState<AttendanceWithCourse[]>([])
  const [loadedKey, setLoadedKey] = useState<string | null>(null)
  const loading = Boolean(student) && loadedKey !== student?.id

  useEffect(() => {
    if (!student) return

    let active = true
    listAttendanceForStudent(student.id)
      .then((result) => {
        if (!active) return
        setRecords(result)
        setLoadedKey(student.id)
      })
      .catch(() => {
        if (active) showToast('error', 'No se pudo cargar el historial de asistencia.')
      })

    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [student?.id])

  const columns: TableColumn<AttendanceWithCourse>[] = [
    { key: 'date', header: 'Fecha', render: (a) => a.date },
    { key: 'course', header: 'Curso', render: (a) => (a.courses ? courseLabel(a.courses) : '—') },
    {
      key: 'status',
      header: 'Estado',
      render: (a) => (
        <Badge variant={STATUS_BADGE_VARIANT[a.status]}>{ATTENDANCE_STATUS_LABELS[a.status]}</Badge>
      ),
    },
    { key: 'notes', header: 'Notas', render: (a) => a.notes ?? '—' },
  ]

  return (
    <div>
      <div className="mb-5 max-w-md">
        <StudentPicker value={student} onChange={setStudent} />
      </div>

      {!student ? (
        <EmptyState
          icon={CalendarCheck}
          title="Selecciona un estudiante"
          description="Busca un estudiante arriba para ver su historial de asistencia."
        />
      ) : (
        <Table
          columns={columns}
          data={records}
          keyField={(a) => a.id}
          loading={loading}
          emptyTitle="Sin registros de asistencia"
        />
      )}
    </div>
  )
}
