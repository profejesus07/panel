import { supabase } from '@/lib/supabase'
import type { Tables, TablesInsert } from '@/types/database.types'
import { getDataErrorMessage } from '@/utils/errors'

export type SchoolSettings = Tables<'school_settings'>
export type SchoolSettingsInput = Omit<
  TablesInsert<'school_settings'>,
  'id' | 'is_active' | 'created_at' | 'updated_at' | 'name' | 'academic_year' | 'country'
> & {
  name: string
  academic_year: string
  country: string
}

export async function getActiveSchoolSettings(): Promise<SchoolSettings | null> {
  const { data, error } = await supabase
    .from('school_settings')
    .select('*')
    .eq('is_active', true)
    .maybeSingle()

  if (error) throw new Error(getDataErrorMessage(error))
  return data
}

export async function saveSchoolSettings(
  id: string | null,
  input: SchoolSettingsInput,
): Promise<SchoolSettings> {
  if (id) {
    const { data, error } = await supabase
      .from('school_settings')
      .update(input)
      .eq('id', id)
      .select()
      .single()

    if (error) throw new Error(getDataErrorMessage(error))
    return data
  }

  const { data, error } = await supabase
    .from('school_settings')
    .insert({ ...input, is_active: true })
    .select()
    .single()

  if (error) throw new Error(getDataErrorMessage(error))
  return data
}

export async function uploadSchoolLogo(file: File): Promise<string> {
  const extension = file.name.split('.').pop() ?? 'png'
  const path = `logo-${Date.now()}.${extension}`

  const { error } = await supabase.storage
    .from('institucion')
    .upload(path, file, { upsert: true, cacheControl: '3600' })

  if (error) {
    throw new Error('No se pudo subir el escudo. Verifica el formato (PNG, JPG, SVG o WebP) y el tamaño (máx. 5 MB).')
  }

  const { data } = supabase.storage.from('institucion').getPublicUrl(path)
  return data.publicUrl
}
