import { HeartHandshake, Pencil, Plus, Trash2 } from 'lucide-react'
import { type FormEvent, useEffect, useState } from 'react'
import { StudentPicker } from '@/components/admin/StudentPicker'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { RowActions } from '@/components/ui/RowActions'
import { Select } from '@/components/ui/Select'
import { Table, type TableColumn } from '@/components/ui/Table'
import { Textarea } from '@/components/ui/Textarea'
import { useConfirm } from '@/hooks/useConfirm'
import { useToast } from '@/hooks/useToast'
import {
  createBehaviorRecord,
  deleteBehaviorRecord,
  listBehaviorRecordsForStudent,
  updateBehaviorRecord,
  type BehaviorRecord,
  type BehaviorRecordInput,
} from '@/services/behaviorRecords.service'
import type { StudentWithCourse } from '@/services/students.service'
import { Constants } from '@/types/database.types'
import { BEHAVIOR_RECORD_STATUS_LABELS, BEHAVIOR_RECORD_TYPE_LABELS } from '@/utils/labels'

function emptyForm(studentId: string): BehaviorRecordInput {
  return {
    student_id: studentId,
    type: 'observacion',
    title: '',
    description: '',
    record_date: new Date().toISOString().slice(0, 10),
    status: 'abierto',
  }
}

const STATUS_BADGE_VARIANT: Record<BehaviorRecord['status'], 'brand' | 'warning' | 'neutral'> = {
  abierto: 'brand',
  en_seguimiento: 'warning',
  cerrado: 'neutral',
}

export function BehaviorRecordsPage() {
  const { showToast } = useToast()
  const confirm = useConfirm()

  const [student, setStudent] = useState<StudentWithCourse | null>(null)
  const [records, setRecords] = useState<BehaviorRecord[]>([])
  const [recordsVersion, setRecordsVersion] = useState(0)
  const [loadedKey, setLoadedKey] = useState<string | null>(null)
  const recordsKey = `${student?.id ?? ''}:${recordsVersion}`
  const loading = Boolean(student) && loadedKey !== recordsKey

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<BehaviorRecord | null>(null)
  const [form, setForm] = useState<BehaviorRecordInput>(emptyForm(''))
  const [errors, setErrors] = useState<Partial<Record<keyof BehaviorRecordInput, string>>>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!student) return

    let active = true
    listBehaviorRecordsForStudent(student.id)
      .then((result) => {
        if (!active) return
        setRecords(result)
        setLoadedKey(recordsKey)
      })
      .catch(() => {
        if (!active) return
        showToast('error', 'No se pudieron cargar los registros de convivencia.')
        setLoadedKey(recordsKey)
      })

    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recordsKey])

  function reload() {
    setRecordsVersion((v) => v + 1)
  }

  function openCreate() {
    if (!student) return
    setEditing(null)
    setForm(emptyForm(student.id))
    setErrors({})
    setModalOpen(true)
  }

  function openEdit(record: BehaviorRecord) {
    setEditing(record)
    setForm({
      student_id: record.student_id,
      type: record.type,
      title: record.title ?? '',
      description: record.description,
      record_date: record.record_date,
      status: record.status,
    })
    setErrors({})
    setModalOpen(true)
  }

  function validate(): boolean {
    const next: Partial<Record<keyof BehaviorRecordInput, string>> = {}
    if (!form.description.trim()) next.description = 'La descripción es obligatoria.'
    if (!form.record_date) next.record_date = 'La fecha es obligatoria.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!validate()) return

    const payload: BehaviorRecordInput = { ...form, title: form.title || null }

    setSaving(true)
    try {
      if (editing) {
        await updateBehaviorRecord(editing.id, payload)
        showToast('success', 'Registro actualizado correctamente.')
      } else {
        await createBehaviorRecord(payload)
        showToast('success', 'Registro creado correctamente.')
      }
      setModalOpen(false)
      reload()
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : 'No se pudo guardar el registro.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(record: BehaviorRecord) {
    const confirmed = await confirm({
      title: '¿Eliminar este registro?',
      description: 'Esta acción no se puede deshacer.',
      confirmLabel: 'Eliminar',
      variant: 'danger',
    })
    if (!confirmed) return

    try {
      await deleteBehaviorRecord(record.id)
      showToast('success', 'Registro eliminado correctamente.')
      reload()
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : 'No se pudo eliminar el registro.')
    }
  }

  const columns: TableColumn<BehaviorRecord>[] = [
    { key: 'date', header: 'Fecha', render: (r) => r.record_date },
    { key: 'type', header: 'Tipo', render: (r) => BEHAVIOR_RECORD_TYPE_LABELS[r.type] },
    {
      key: 'title',
      header: 'Título / descripción',
      render: (r) => (
        <div>
          {r.title && <p className="font-medium text-neutral-900">{r.title}</p>}
          <p className="line-clamp-1 text-neutral-500">{r.description}</p>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Estado',
      render: (r) => (
        <Badge variant={STATUS_BADGE_VARIANT[r.status]}>{BEHAVIOR_RECORD_STATUS_LABELS[r.status]}</Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (r) => (
        <RowActions
          actions={[
            { label: 'Editar', icon: <Pencil className="h-4 w-4" />, onClick: () => openEdit(r) },
            {
              label: 'Eliminar',
              icon: <Trash2 className="h-4 w-4" />,
              variant: 'danger',
              onClick: () => void handleDelete(r),
            },
          ]}
        />
      ),
    },
  ]

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900">Convivencia</h1>
        <p className="text-sm text-neutral-500">
          Observaciones, reconocimientos, compromisos y seguimiento por estudiante.
        </p>
      </div>

      <div className="mb-6 max-w-md">
        <StudentPicker value={student} onChange={setStudent} />
      </div>

      {!student ? (
        <EmptyState
          icon={HeartHandshake}
          title="Selecciona un estudiante"
          description="Busca un estudiante arriba para ver o registrar su convivencia."
        />
      ) : (
        <>
          <div className="mb-4 flex justify-end">
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4" />
              Nuevo registro
            </Button>
          </div>
          <Table
            columns={columns}
            data={records}
            keyField={(r) => r.id}
            loading={loading}
            emptyTitle="Sin registros de convivencia"
            emptyDescription="Registra la primera observación, reconocimiento o compromiso."
          />
        </>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Editar registro' : 'Nuevo registro de convivencia'}
      >
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <Select
            label="Tipo"
            value={form.type}
            onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as BehaviorRecord['type'] }))}
          >
            {Constants.public.Enums.behavior_record_type.map((type) => (
              <option key={type} value={type}>
                {BEHAVIOR_RECORD_TYPE_LABELS[type]}
              </option>
            ))}
          </Select>
          <Input
            label="Título (opcional)"
            value={form.title ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          />
          <Textarea
            label="Descripción"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            error={errors.description}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Fecha"
              type="date"
              value={form.record_date}
              onChange={(e) => setForm((f) => ({ ...f, record_date: e.target.value }))}
              error={errors.record_date}
            />
            <Select
              label="Estado"
              value={form.status}
              onChange={(e) =>
                setForm((f) => ({ ...f, status: e.target.value as BehaviorRecord['status'] }))
              }
            >
              {Constants.public.Enums.behavior_record_status.map((status) => (
                <option key={status} value={status}>
                  {BEHAVIOR_RECORD_STATUS_LABELS[status]}
                </option>
              ))}
            </Select>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" loading={saving}>
              {editing ? 'Guardar cambios' : 'Crear registro'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
