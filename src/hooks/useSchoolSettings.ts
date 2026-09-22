import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Tables } from '@/types/database.types'

export type SchoolSettings = Tables<'school_settings'>

// Config institucional activa. Se usa en login, sidebar, boletines, etc. para
// que el nombre/escudo del colegio se actualice en toda la app al cambiarlo.
export function useSchoolSettings() {
  const [settings, setSettings] = useState<SchoolSettings | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    supabase
      .from('school_settings')
      .select('*')
      .eq('is_active', true)
      .maybeSingle()
      .then(({ data }) => {
        if (!active) return
        setSettings(data)
        setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  return { settings, loading }
}
