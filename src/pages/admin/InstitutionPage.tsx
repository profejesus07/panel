import { Building2, Upload } from 'lucide-react'
import { type FormEvent, useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { FullPageSpinner } from '@/components/ui/Spinner'
import { useToast } from '@/hooks/useToast'
import {
  getActiveSchoolSettings,
  saveSchoolSettings,
  uploadSchoolLogo,
  type SchoolSettings,
  type SchoolSettingsInput,
} from '@/services/schoolSettings.service'
import { isValidEmail } from '@/utils/validation'

const EMPTY_FORM: SchoolSettingsInput = {
  name: '',
  nit: '',
  academic_year: new Date().getFullYear().toString(),
  motto: '',
  country: 'Colombia',
  state: '',
  city: '',
  address: '',
  phone: '',
  email: '',
  website: '',
  logo_url: null,
}

function toFormState(settings: SchoolSettings | null): SchoolSettingsInput {
  if (!settings) return EMPTY_FORM
  return {
    name: settings.name,
    nit: settings.nit ?? '',
    academic_year: settings.academic_year,
    motto: settings.motto ?? '',
    country: settings.country,
    state: settings.state ?? '',
    city: settings.city ?? '',
    address: settings.address ?? '',
    phone: settings.phone ?? '',
    email: settings.email ?? '',
    website: settings.website ?? '',
    logo_url: settings.logo_url,
  }
}

export function InstitutionPage() {
  const { showToast } = useToast()
  const [settingsId, setSettingsId] = useState<string | null>(null)
  const [form, setForm] = useState<SchoolSettingsInput>(EMPTY_FORM)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<keyof SchoolSettingsInput, string>>>({})

  useEffect(() => {
    let active = true

    getActiveSchoolSettings()
      .then((settings) => {
        if (!active) return
        setSettingsId(settings?.id ?? null)
        setForm(toFormState(settings))
      })
      .catch(() => {
        if (active) showToast('error', 'No se pudo cargar la configuración institucional.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function updateField<K extends keyof SchoolSettingsInput>(key: K, value: SchoolSettingsInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleLogoChange(file: File | undefined) {
    if (!file) return

    setUploadingLogo(true)
    try {
      const url = await uploadSchoolLogo(file)
      updateField('logo_url', url)
      showToast('success', 'Escudo actualizado. Recuerda guardar los cambios.')
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : 'No se pudo subir el escudo.')
    } finally {
      setUploadingLogo(false)
    }
  }

  function validate(): boolean {
    const nextErrors: Partial<Record<keyof SchoolSettingsInput, string>> = {}

    if (!form.name.trim()) nextErrors.name = 'El nombre de la institución es obligatorio.'
    if (!form.academic_year.trim()) nextErrors.academic_year = 'El año lectivo es obligatorio.'
    if (!form.country.trim()) nextErrors.country = 'El país es obligatorio.'
    if (form.email && !isValidEmail(form.email)) nextErrors.email = 'Ingresa un correo válido.'

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!validate()) return

    setSaving(true)
    try {
      const saved = await saveSchoolSettings(settingsId, {
        ...form,
        nit: form.nit || null,
        motto: form.motto || null,
        state: form.state || null,
        city: form.city || null,
        address: form.address || null,
        phone: form.phone || null,
        email: form.email || null,
        website: form.website || null,
      })
      setSettingsId(saved.id)
      setForm(toFormState(saved))
      showToast('success', 'Configuración institucional guardada correctamente.')
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : 'No se pudo guardar la configuración.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <FullPageSpinner />

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900">Institución</h1>
        <p className="text-sm text-neutral-500">
          Esta información se usa en el login, el panel, los boletines y los documentos oficiales.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        <Card>
          <CardHeader>
            <CardTitle>Escudo institucional</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4 sm:flex-row">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-neutral-200 bg-neutral-50">
              {form.logo_url ? (
                <img src={form.logo_url} alt="Escudo" className="h-full w-full object-contain" />
              ) : (
                <Building2 className="h-8 w-8 text-neutral-300" />
              )}
            </div>
            <div>
              <label htmlFor="logo-upload">
                <span className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50">
                  <Upload className="h-4 w-4" />
                  {uploadingLogo ? 'Subiendo...' : 'Subir escudo'}
                </span>
                <input
                  id="logo-upload"
                  type="file"
                  accept="image/png,image/jpeg,image/svg+xml,image/webp"
                  className="hidden"
                  disabled={uploadingLogo}
                  onChange={(e) => void handleLogoChange(e.target.files?.[0])}
                />
              </label>
              <p className="mt-2 text-xs text-neutral-500">PNG, JPG, SVG o WebP. Máximo 5 MB.</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Información general</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Nombre de la institución"
              value={form.name}
              onChange={(e) => updateField('name', e.target.value)}
              error={errors.name}
            />
            <Input
              label="NIT"
              value={form.nit ?? ''}
              onChange={(e) => updateField('nit', e.target.value)}
            />
            <Input
              label="Año lectivo"
              value={form.academic_year}
              onChange={(e) => updateField('academic_year', e.target.value)}
              error={errors.academic_year}
              placeholder="2026"
            />
            <Input
              label="Lema / eslogan"
              value={form.motto ?? ''}
              onChange={(e) => updateField('motto', e.target.value)}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ubicación</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="País"
              value={form.country}
              onChange={(e) => updateField('country', e.target.value)}
              error={errors.country}
            />
            <Input
              label="Departamento"
              value={form.state ?? ''}
              onChange={(e) => updateField('state', e.target.value)}
            />
            <Input
              label="Ciudad"
              value={form.city ?? ''}
              onChange={(e) => updateField('city', e.target.value)}
            />
            <Input
              label="Dirección"
              value={form.address ?? ''}
              onChange={(e) => updateField('address', e.target.value)}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contacto</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Teléfono"
              value={form.phone ?? ''}
              onChange={(e) => updateField('phone', e.target.value)}
            />
            <Input
              label="Correo"
              type="email"
              value={form.email ?? ''}
              onChange={(e) => updateField('email', e.target.value)}
              error={errors.email}
            />
            <Input
              label="Sitio web"
              value={form.website ?? ''}
              onChange={(e) => updateField('website', e.target.value)}
              placeholder="https://..."
            />
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" loading={saving}>
            Guardar cambios
          </Button>
        </div>
      </form>
    </div>
  )
}
