import { BookOpen, CalendarRange, Gauge, Pencil, Plus, RotateCcw, Trash2, X } from 'lucide-react'
import { type FormEvent, useState } from 'react'
import { DangerZoneCard } from '@/components/admin/DangerZoneCard'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Select } from '@/components/ui/Select'
import { Skeleton } from '@/components/ui/Skeleton'
import { useConfirm } from '@/hooks/useConfirm'
import { useSimpleQuery } from '@/hooks/useSimpleQuery'
import { useToast } from '@/hooks/useToast'
import {
  createAcademicPeriod,
  createSubject,
  deleteAcademicPeriod,
  deleteSubject,
  listAcademicPeriods,
  listSubjects,
  updateAcademicPeriod,
  type AcademicPeriod,
  type AcademicPeriodInput,
  type Subject,
} from '@/services/academicCatalog.service'
import {
  listPerformanceLevels,
  performanceLevelColor,
  updatePerformanceLevels,
  type PerformanceLevel,
  type PerformanceLevelUpdate,
} from '@/services/performanceLevels.service'
import { Constants } from '@/types/database.types'
import { COURSE_STATUS_LABELS } from '@/utils/labels'

export function ConfigurationPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900">Configuración</h1>
        <p className="text-sm text-neutral-500">Catálogos académicos usados en calificaciones.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <SubjectsCard />
        <AcademicPeriodsCard />
      </div>

      <div className="mt-6">
        <PerformanceLevelsCard />
      </div>

      <div className="mt-6">
        <DangerZoneCard />
      </div>
    </div>
  )
}

function SubjectsCard() {
  const { showToast } = useToast()
  const confirm = useConfirm()
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)

  const {
    data: subjects,
    loading,
    reload,
  } = useSimpleQuery(listSubjects, [] as Subject[], () =>
    showToast('error', 'No se pudieron cargar las asignaturas.'),
  )

  async function handleAdd(event: FormEvent) {
    event.preventDefault()
    if (!name.trim()) return

    setSaving(true)
    try {
      await createSubject({ name: name.trim() })
      setName('')
      reload()
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : 'No se pudo crear la asignatura.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(subject: Subject) {
    const confirmed = await confirm({
      title: `¿Eliminar "${subject.name}"?`,
      description: 'No podrás eliminarla si tiene calificaciones registradas.',
      confirmLabel: 'Eliminar',
      variant: 'danger',
    })
    if (!confirmed) return

    try {
      await deleteSubject(subject.id)
      reload()
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : 'No se pudo eliminar la asignatura.')
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-brand-700" />
          Asignaturas
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleAdd} className="mb-4 flex gap-2">
          <Input
            placeholder="Nueva asignatura..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" loading={saving} disabled={!name.trim()}>
            <Plus className="h-4 w-4" />
            Agregar
          </Button>
        </form>

        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-full" />
            ))}
          </div>
        ) : subjects.length === 0 ? (
          <EmptyState title="Sin asignaturas" description="Agrega la primera asignatura arriba." />
        ) : (
          <ul className="divide-y divide-neutral-200 rounded-lg border border-neutral-200">
            {subjects.map((subject) => (
              <li key={subject.id} className="flex items-center justify-between px-3.5 py-2 text-sm">
                {subject.name}
                <button
                  type="button"
                  onClick={() => void handleDelete(subject)}
                  className="rounded-md p-1 text-neutral-400 hover:bg-danger-50 hover:text-danger-600"
                  aria-label={`Eliminar ${subject.name}`}
                >
                  <X className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

const EMPTY_PERIOD_FORM: AcademicPeriodInput = {
  name: '',
  academic_year: new Date().getFullYear().toString(),
  start_date: '',
  end_date: '',
  status: 'activo',
}

function AcademicPeriodsCard() {
  const { showToast } = useToast()
  const confirm = useConfirm()

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<AcademicPeriod | null>(null)
  const [form, setForm] = useState<AcademicPeriodInput>(EMPTY_PERIOD_FORM)
  const [errors, setErrors] = useState<Partial<Record<keyof AcademicPeriodInput, string>>>({})
  const [saving, setSaving] = useState(false)

  const {
    data: periods,
    loading,
    reload,
  } = useSimpleQuery(listAcademicPeriods, [] as AcademicPeriod[], () =>
    showToast('error', 'No se pudieron cargar los períodos académicos.'),
  )

  function openCreate() {
    setEditing(null)
    setForm(EMPTY_PERIOD_FORM)
    setErrors({})
    setModalOpen(true)
  }

  function openEdit(period: AcademicPeriod) {
    setEditing(period)
    setForm({
      name: period.name,
      academic_year: period.academic_year,
      start_date: period.start_date,
      end_date: period.end_date,
      status: period.status,
    })
    setErrors({})
    setModalOpen(true)
  }

  function validate(): boolean {
    const next: Partial<Record<keyof AcademicPeriodInput, string>> = {}
    if (!form.name.trim()) next.name = 'El nombre es obligatorio.'
    if (!form.academic_year.trim()) next.academic_year = 'El año lectivo es obligatorio.'
    if (!form.start_date) next.start_date = 'La fecha de inicio es obligatoria.'
    if (!form.end_date) next.end_date = 'La fecha de fin es obligatoria.'
    else if (form.start_date && form.end_date < form.start_date) {
      next.end_date = 'Debe ser posterior a la fecha de inicio.'
    }
    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!validate()) return

    setSaving(true)
    try {
      if (editing) {
        await updateAcademicPeriod(editing.id, form)
        showToast('success', 'Período actualizado correctamente.')
      } else {
        await createAcademicPeriod(form)
        showToast('success', 'Período creado correctamente.')
      }
      setModalOpen(false)
      reload()
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : 'No se pudo guardar el período.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(period: AcademicPeriod) {
    const confirmed = await confirm({
      title: `¿Eliminar el período "${period.name}"?`,
      description: 'No podrás eliminarlo si tiene calificaciones registradas.',
      confirmLabel: 'Eliminar',
      variant: 'danger',
    })
    if (!confirmed) return

    try {
      await deleteAcademicPeriod(period.id)
      showToast('success', 'Período eliminado correctamente.')
      reload()
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : 'No se pudo eliminar el período.')
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <CalendarRange className="h-4 w-4 text-brand-700" />
          Períodos académicos
        </CardTitle>
        <Button size="sm" onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Nuevo
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : periods.length === 0 ? (
          <EmptyState
            icon={CalendarRange}
            title="Sin períodos académicos"
            description="Crea el primer período para poder registrar calificaciones."
          />
        ) : (
          <ul className="divide-y divide-neutral-200 rounded-lg border border-neutral-200">
            {periods.map((period) => (
              <li key={period.id} className="flex items-center justify-between px-3.5 py-2.5 text-sm">
                <div>
                  <p className="font-medium text-neutral-900">
                    {period.name} <span className="text-neutral-400">· {period.academic_year}</span>
                  </p>
                  <p className="text-xs text-neutral-500">
                    {period.start_date} — {period.end_date}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={period.status === 'activo' ? 'success' : 'neutral'}>
                    {COURSE_STATUS_LABELS[period.status]}
                  </Badge>
                  <button
                    type="button"
                    onClick={() => openEdit(period)}
                    className="rounded-md p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600"
                    aria-label="Editar período"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleDelete(period)}
                    className="rounded-md p-1.5 text-neutral-400 hover:bg-danger-50 hover:text-danger-600"
                    aria-label="Eliminar período"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Editar período académico' : 'Nuevo período académico'}
        size="sm"
      >
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <Input
            label="Nombre"
            placeholder="Ej. Período 1"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            error={errors.name}
          />
          <Input
            label="Año lectivo"
            value={form.academic_year}
            onChange={(e) => setForm((f) => ({ ...f, academic_year: e.target.value }))}
            error={errors.academic_year}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Fecha de inicio"
              type="date"
              value={form.start_date}
              onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))}
              error={errors.start_date}
            />
            <Input
              label="Fecha de fin"
              type="date"
              value={form.end_date}
              onChange={(e) => setForm((f) => ({ ...f, end_date: e.target.value }))}
              error={errors.end_date}
            />
          </div>
          <Select
            label="Estado"
            value={form.status}
            onChange={(e) =>
              setForm((f) => ({ ...f, status: e.target.value as AcademicPeriod['status'] }))
            }
          >
            {Constants.public.Enums.course_status.map((status) => (
              <option key={status} value={status}>
                {COURSE_STATUS_LABELS[status]}
              </option>
            ))}
          </Select>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" loading={saving}>
              {editing ? 'Guardar cambios' : 'Crear período'}
            </Button>
          </div>
        </form>
      </Modal>
    </Card>
  )
}

function PerformanceLevelsCard() {
  const { showToast } = useToast()
  const {
    data: levels,
    loading,
    reload,
  } = useSimpleQuery(listPerformanceLevels, [] as PerformanceLevel[], () =>
    showToast('error', 'No se pudieron cargar los desempeños.'),
  )

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Gauge className="h-4 w-4 text-brand-700" />
          Escala de valoración
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-4 text-sm text-neutral-500">
          Define el nombre y el rango de puntaje de cada desempeño. Se usan para clasificar
          calificaciones en Calificaciones y en Estadísticas.
        </p>

        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : (
          // key fuerza reiniciar el formulario cuando llegan datos nuevos del
          // servidor (carga inicial o tras guardar), sin depender de un
          // efecto que sincronice el estado local con las props.
          <PerformanceLevelsForm
            key={levels.map((l) => `${l.id}:${l.updated_at}`).join('|')}
            levels={levels}
            onSaved={() => {
              showToast('success', 'Escala de valoración actualizada correctamente.')
              reload()
            }}
            onError={(message) => showToast('error', message)}
          />
        )}
      </CardContent>
    </Card>
  )
}

function PerformanceLevelsForm({
  levels,
  onSaved,
  onError,
}: {
  levels: PerformanceLevel[]
  onSaved: () => void
  onError: (message: string) => void
}) {
  const [rows, setRows] = useState<PerformanceLevelUpdate[]>(() =>
    levels.map((l) => ({ id: l.id, name: l.name, min_score: l.min_score, max_score: l.max_score })),
  )
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  function updateRow(id: string, patch: Partial<Omit<PerformanceLevelUpdate, 'id'>>) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)))
  }

  function resetToDefaults() {
    const defaults: Record<string, { name: string; min_score: number; max_score: number }> = {
      bajo: { name: 'Bajo', min_score: 0, max_score: 6.9 },
      basico: { name: 'Básico', min_score: 7, max_score: 7.9 },
      alto: { name: 'Alto', min_score: 8, max_score: 8.9 },
      superior: { name: 'Superior', min_score: 9, max_score: 10 },
    }
    setRows((prev) =>
      prev.map((r) => {
        const level = levels.find((l) => l.id === r.id)
        const fallback = level ? defaults[level.slug] : undefined
        return fallback ? { ...r, ...fallback } : r
      }),
    )
    setErrors({})
  }

  function validate(): boolean {
    const next: Record<string, string> = {}
    for (const row of rows) {
      if (!row.name.trim()) next[row.id] = 'El nombre es obligatorio.'
      else if (row.min_score > row.max_score) next[row.id] = 'El mínimo no puede ser mayor al máximo.'
    }
    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleSave() {
    if (!validate()) return

    setSaving(true)
    try {
      await updatePerformanceLevels(rows)
      onSaved()
    } catch (error) {
      onError(error instanceof Error ? error.message : 'No se pudo guardar la escala.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div className="mb-3 flex justify-end">
        <Button size="sm" variant="outline" onClick={resetToDefaults}>
          <RotateCcw className="h-4 w-4" />
          Restablecer valores por defecto
        </Button>
      </div>

      <div className="space-y-3">
        {levels.map((level) => {
          const row = rows.find((r) => r.id === level.id)
          if (!row) return null
          const color = performanceLevelColor(level.slug)

          return (
            <div
              key={level.id}
              className="grid grid-cols-1 items-start gap-3 rounded-lg border border-neutral-200 p-3.5 sm:grid-cols-[auto_1fr_auto_auto]"
            >
              <div className="flex items-center gap-2 pt-2.5 sm:pt-0">
                <span className={`h-3 w-3 shrink-0 rounded-full ${color.dot}`} aria-hidden />
                <span className="text-xs font-medium uppercase tracking-wide text-neutral-400">
                  {level.slug}
                </span>
              </div>
              <Input
                label="Nombre"
                value={row.name}
                onChange={(e) => updateRow(level.id, { name: e.target.value })}
                error={errors[level.id]}
              />
              <Input
                label="Mínimo"
                type="number"
                step="0.1"
                className="sm:w-24"
                value={row.min_score}
                onChange={(e) => updateRow(level.id, { min_score: Number(e.target.value) })}
              />
              <Input
                label="Máximo"
                type="number"
                step="0.1"
                className="sm:w-24"
                value={row.max_score}
                onChange={(e) => updateRow(level.id, { max_score: Number(e.target.value) })}
              />
            </div>
          )
        })}
      </div>

      <div className="mt-4 flex justify-end border-t border-neutral-200 pt-4">
        <Button onClick={() => void handleSave()} loading={saving}>
          Guardar escala
        </Button>
      </div>
    </div>
  )
}
