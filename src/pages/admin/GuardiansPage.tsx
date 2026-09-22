import { Link2, Pencil, Plus, Search, Star, Trash2, UserRound, UsersRound } from 'lucide-react'
import { type FormEvent, useEffect, useState } from 'react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Pagination } from '@/components/ui/Pagination'
import { RowActions } from '@/components/ui/RowActions'
import { Select } from '@/components/ui/Select'
import { Table, type TableColumn } from '@/components/ui/Table'
import { useConfirm } from '@/hooks/useConfirm'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { useListQuery } from '@/hooks/useListQuery'
import { useToast } from '@/hooks/useToast'
import {
  createGuardian,
  deleteGuardian,
  guardianFullName,
  listGuardians,
  updateGuardian,
  type Guardian,
  type GuardianInput,
} from '@/services/guardians.service'
import { listStudents, studentFullName, type StudentWithCourse } from '@/services/students.service'
import {
  createLink,
  deleteLink,
  listLinksForGuardian,
  updateLink,
  type LinkWithStudent,
} from '@/services/studentGuardians.service'
import { Constants } from '@/types/database.types'
import { DEFAULT_PAGE_SIZE } from '@/types/common'
import { DOCUMENT_TYPE_LABELS, GUARDIAN_RELATIONSHIP_LABELS } from '@/utils/labels'
import { isValidEmail } from '@/utils/validation'

const EMPTY_FORM: GuardianInput = {
  first_name: '',
  last_name: '',
  document_type: 'CC',
  document_number: '',
  phone: '',
  email: '',
  address: '',
}

function toFormState(guardian: Guardian): GuardianInput {
  return {
    first_name: guardian.first_name,
    last_name: guardian.last_name,
    document_type: guardian.document_type,
    document_number: guardian.document_number,
    phone: guardian.phone ?? '',
    email: guardian.email ?? '',
    address: guardian.address ?? '',
  }
}

export function GuardiansPage() {
  const { showToast } = useToast()
  const confirm = useConfirm()

  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search)

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Guardian | null>(null)
  const [form, setForm] = useState<GuardianInput>(EMPTY_FORM)
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof GuardianInput, string>>>({})
  const [saving, setSaving] = useState(false)

  const [linkingGuardian, setLinkingGuardian] = useState<Guardian | null>(null)

  const {
    data: guardians,
    count: total,
    loading,
    reload,
  } = useListQuery(
    { page, pageSize: DEFAULT_PAGE_SIZE, search: debouncedSearch || undefined },
    listGuardians,
    () => showToast('error', 'No se pudieron cargar los padres y acudientes.'),
  )

  function handleSearchChange(value: string) {
    setSearch(value)
    setPage(1)
  }

  function openCreate() {
    setEditing(null)
    setForm(EMPTY_FORM)
    setFormErrors({})
    setModalOpen(true)
  }

  function openEdit(guardian: Guardian) {
    setEditing(guardian)
    setForm(toFormState(guardian))
    setFormErrors({})
    setModalOpen(true)
  }

  function validate(): boolean {
    const errors: Partial<Record<keyof GuardianInput, string>> = {}
    if (!form.first_name.trim()) errors.first_name = 'Los nombres son obligatorios.'
    if (!form.last_name.trim()) errors.last_name = 'Los apellidos son obligatorios.'
    if (!form.document_number.trim()) errors.document_number = 'El número de documento es obligatorio.'
    if (form.email && !isValidEmail(form.email)) errors.email = 'Ingresa un correo válido.'
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!validate()) return

    const payload: GuardianInput = {
      ...form,
      phone: form.phone || null,
      email: form.email || null,
      address: form.address || null,
    }

    setSaving(true)
    try {
      if (editing) {
        await updateGuardian(editing.id, payload)
        showToast('success', 'Padre/acudiente actualizado correctamente.')
      } else {
        await createGuardian(payload)
        showToast('success', 'Padre/acudiente creado correctamente.')
      }
      setModalOpen(false)
      reload()
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : 'No se pudo guardar el registro.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(guardian: Guardian) {
    const confirmed = await confirm({
      title: `¿Eliminar a ${guardianFullName(guardian)}?`,
      description: 'Esta acción no se puede deshacer y quitará su vínculo con cualquier estudiante asociado.',
      confirmLabel: 'Eliminar',
      variant: 'danger',
    })
    if (!confirmed) return

    try {
      await deleteGuardian(guardian.id)
      showToast('success', 'Registro eliminado correctamente.')
      reload()
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : 'No se pudo eliminar el registro.')
    }
  }

  const columns: TableColumn<Guardian>[] = [
    {
      key: 'name',
      header: 'Nombre',
      render: (g) => <span className="font-medium text-neutral-900">{guardianFullName(g)}</span>,
    },
    {
      key: 'document',
      header: 'Documento',
      render: (g) => (
        <span>
          {DOCUMENT_TYPE_LABELS[g.document_type]} {g.document_number}
        </span>
      ),
    },
    { key: 'phone', header: 'Teléfono', render: (g) => g.phone ?? '—' },
    { key: 'email', header: 'Correo', render: (g) => g.email ?? '—' },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (g) => (
        <RowActions
          actions={[
            {
              label: 'Vincular estudiantes',
              icon: <Link2 className="h-4 w-4" />,
              onClick: () => setLinkingGuardian(g),
            },
            { label: 'Editar', icon: <Pencil className="h-4 w-4" />, onClick: () => openEdit(g) },
            {
              label: 'Eliminar',
              icon: <Trash2 className="h-4 w-4" />,
              variant: 'danger',
              onClick: () => void handleDelete(g),
            },
          ]}
        />
      ),
    },
  ]

  return (
    <div>
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Padres y acudientes</h1>
          <p className="text-sm text-neutral-500">
            Registro de padres, madres, tutores y acudientes, y su vínculo con los estudiantes.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Nuevo registro
        </Button>
      </div>

      <div className="relative mb-4">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
        <Input
          placeholder="Buscar por nombre o documento..."
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="max-w-sm pl-10"
        />
      </div>

      <Table
        columns={columns}
        data={guardians}
        keyField={(g) => g.id}
        loading={loading}
        emptyTitle="No hay padres o acudientes registrados"
        emptyDescription="Crea el primer registro y luego vincúlalo con sus estudiantes."
      />
      <Pagination page={page} pageSize={DEFAULT_PAGE_SIZE} total={total} onPageChange={setPage} />

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Editar padre/acudiente' : 'Nuevo padre/acudiente'}
      >
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Nombres"
              value={form.first_name}
              onChange={(e) => setForm((f) => ({ ...f, first_name: e.target.value }))}
              error={formErrors.first_name}
            />
            <Input
              label="Apellidos"
              value={form.last_name}
              onChange={(e) => setForm((f) => ({ ...f, last_name: e.target.value }))}
              error={formErrors.last_name}
            />
            <Select
              label="Tipo de documento"
              value={form.document_type}
              onChange={(e) =>
                setForm((f) => ({ ...f, document_type: e.target.value as Guardian['document_type'] }))
              }
            >
              {Constants.public.Enums.document_type.map((type) => (
                <option key={type} value={type}>
                  {DOCUMENT_TYPE_LABELS[type]}
                </option>
              ))}
            </Select>
            <Input
              label="Número de documento"
              value={form.document_number}
              onChange={(e) => setForm((f) => ({ ...f, document_number: e.target.value }))}
              error={formErrors.document_number}
            />
            <Input
              label="Teléfono"
              value={form.phone ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            />
            <Input
              label="Correo"
              type="email"
              value={form.email ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              error={formErrors.email}
            />
            <Input
              label="Dirección"
              value={form.address ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
              className="sm:col-span-2"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" loading={saving}>
              <UserRound className="h-4 w-4" />
              {editing ? 'Guardar cambios' : 'Crear registro'}
            </Button>
          </div>
        </form>
      </Modal>

      {linkingGuardian && (
        <LinkStudentsModal guardian={linkingGuardian} onClose={() => setLinkingGuardian(null)} />
      )}
    </div>
  )
}

function LinkStudentsModal({ guardian, onClose }: { guardian: Guardian; onClose: () => void }) {
  const { showToast } = useToast()
  const confirm = useConfirm()

  const [linksVersion, setLinksVersion] = useState(0)
  const [links, setLinks] = useState<LinkWithStudent[]>([])
  const [loadedLinksKey, setLoadedLinksKey] = useState<string | null>(null)
  const linksKey = `${guardian.id}:${linksVersion}`
  const loadingLinks = loadedLinksKey !== linksKey

  const [studentSearch, setStudentSearch] = useState('')
  const debouncedStudentSearch = useDebouncedValue(studentSearch)
  const [studentResults, setStudentResults] = useState<StudentWithCourse[]>([])
  const [selectedStudentId, setSelectedStudentId] = useState('')
  const [relationship, setRelationship] = useState<LinkWithStudent['relationship']>('acudiente')
  const [isPrimary, setIsPrimary] = useState(false)
  const [linking, setLinking] = useState(false)

  function reloadLinks() {
    setLinksVersion((v) => v + 1)
  }

  useEffect(() => {
    let active = true

    listLinksForGuardian(guardian.id)
      .then((result) => {
        if (!active) return
        setLinks(result)
        setLoadedLinksKey(linksKey)
      })
      .catch(() => {
        if (!active) return
        showToast('error', 'No se pudieron cargar los estudiantes vinculados.')
        setLoadedLinksKey(linksKey)
      })

    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [linksKey])

  const visibleStudentResults = debouncedStudentSearch.trim() ? studentResults : []

  useEffect(() => {
    if (!debouncedStudentSearch.trim()) return

    let active = true
    listStudents({ search: debouncedStudentSearch, pageSize: 8 })
      .then((result) => {
        if (active) setStudentResults(result.data)
      })
      .catch(() => {
        if (active) showToast('error', 'No se pudo buscar estudiantes.')
      })
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedStudentSearch])

  const linkedStudentIds = new Set(links.map((l) => l.student_id))

  async function handleLink() {
    if (!selectedStudentId) return

    setLinking(true)
    try {
      await createLink({
        student_id: selectedStudentId,
        guardian_id: guardian.id,
        relationship,
        is_primary: isPrimary,
      })
      showToast('success', 'Estudiante vinculado correctamente.')
      setSelectedStudentId('')
      setStudentSearch('')
      setStudentResults([])
      setIsPrimary(false)
      reloadLinks()
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : 'No se pudo vincular al estudiante.')
    } finally {
      setLinking(false)
    }
  }

  async function handleSetPrimary(link: LinkWithStudent) {
    try {
      await updateLink(link.id, { is_primary: true })
      reloadLinks()
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : 'No se pudo actualizar el vínculo.')
    }
  }

  async function handleUnlink(link: LinkWithStudent) {
    const confirmed = await confirm({
      title: '¿Quitar este vínculo?',
      description: link.students
        ? `${guardianFullName(guardian)} dejará de estar asociado a ${studentFullName(link.students)}.`
        : undefined,
      confirmLabel: 'Quitar vínculo',
      variant: 'danger',
    })
    if (!confirmed) return

    try {
      await deleteLink(link.id)
      showToast('success', 'Vínculo eliminado.')
      reloadLinks()
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : 'No se pudo quitar el vínculo.')
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={`Estudiantes vinculados a ${guardianFullName(guardian)}`}
      size="lg"
    >
      <div className="space-y-6">
        <div>
          <h3 className="mb-3 text-sm font-semibold text-neutral-900">Vínculos actuales</h3>
          {loadingLinks ? (
            <p className="text-sm text-neutral-500">Cargando...</p>
          ) : links.length === 0 ? (
            <EmptyState
              icon={UsersRound}
              title="Sin estudiantes vinculados"
              description="Busca un estudiante abajo para vincularlo."
            />
          ) : (
            <ul className="divide-y divide-neutral-200 rounded-lg border border-neutral-200">
              {links.map((link) => (
                <li key={link.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-neutral-900">
                      {link.students ? studentFullName(link.students) : 'Estudiante eliminado'}
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      <Badge variant="neutral">{GUARDIAN_RELATIONSHIP_LABELS[link.relationship]}</Badge>
                      {link.is_primary && (
                        <Badge variant="brand">
                          <Star className="mr-1 h-3 w-3" />
                          Acudiente principal
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    {!link.is_primary && (
                      <Button variant="ghost" size="sm" onClick={() => void handleSetPrimary(link)}>
                        Marcar principal
                      </Button>
                    )}
                    <button
                      type="button"
                      onClick={() => void handleUnlink(link)}
                      className="rounded-md p-2 text-neutral-400 hover:bg-danger-50 hover:text-danger-600"
                      aria-label="Quitar vínculo"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="border-t border-neutral-200 pt-5">
          <h3 className="mb-3 text-sm font-semibold text-neutral-900">Vincular un estudiante</h3>
          <div className="relative mb-3">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <Input
              placeholder="Busca por nombre, documento o código..."
              value={studentSearch}
              onChange={(e) => {
                setStudentSearch(e.target.value)
                setSelectedStudentId('')
              }}
              className="pl-10"
            />
          </div>

          {visibleStudentResults.length > 0 && !selectedStudentId && (
            <ul className="mb-3 max-h-40 divide-y divide-neutral-200 overflow-y-auto rounded-lg border border-neutral-200">
              {visibleStudentResults.map((s) => (
                <li key={s.id}>
                  <button
                    type="button"
                    disabled={linkedStudentIds.has(s.id)}
                    onClick={() => {
                      setSelectedStudentId(s.id)
                      setStudentSearch(studentFullName(s))
                    }}
                    className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <span>
                      {studentFullName(s)} <span className="text-neutral-400">· {s.student_code}</span>
                    </span>
                    {linkedStudentIds.has(s.id) && (
                      <span className="text-xs text-neutral-400">Ya vinculado</span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Select
              label="Parentesco"
              value={relationship}
              onChange={(e) => setRelationship(e.target.value as LinkWithStudent['relationship'])}
            >
              {Constants.public.Enums.guardian_relationship.map((rel) => (
                <option key={rel} value={rel}>
                  {GUARDIAN_RELATIONSHIP_LABELS[rel]}
                </option>
              ))}
            </Select>
            <label className="flex items-center gap-2 self-end pb-2.5 text-sm text-neutral-700">
              <input
                type="checkbox"
                checked={isPrimary}
                onChange={(e) => setIsPrimary(e.target.checked)}
                className="h-4 w-4 rounded border-neutral-300 text-brand-700 focus:ring-brand-500"
              />
              Es el acudiente principal
            </label>
          </div>

          <div className="mt-4 flex justify-end">
            <Button
              type="button"
              onClick={() => void handleLink()}
              disabled={!selectedStudentId}
              loading={linking}
            >
              <Link2 className="h-4 w-4" />
              Vincular estudiante
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
