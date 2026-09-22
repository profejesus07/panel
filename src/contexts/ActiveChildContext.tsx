import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { listMyChildren } from '@/services/myFamily.service'
import type { StudentWithCourse } from '@/services/students.service'
import { ActiveChildContext } from './active-child-context'

const STORAGE_KEY = 'panel-escolar:active-child-id'

function readStoredChildId(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

function storeChildId(id: string) {
  try {
    localStorage.setItem(STORAGE_KEY, id)
  } catch {
    // Almacenamiento no disponible (navegación privada, etc.): no es crítico.
  }
}

export function ActiveChildProvider({ children: reactChildren }: { children: ReactNode }) {
  const [children, setChildren] = useState<StudentWithCourse[]>([])
  const [loadedVersion, setLoadedVersion] = useState<number | null>(null)
  const [activeChildId, setActiveChildIdState] = useState<string | null>(null)
  const loading = loadedVersion !== 0

  useEffect(() => {
    let active = true

    listMyChildren()
      .then((result) => {
        if (!active) return
        setChildren(result)
        setLoadedVersion(0)

        const stored = readStoredChildId()
        const initial = result.find((c) => c.id === stored) ?? result[0]
        if (initial) setActiveChildIdState(initial.id)
      })
      .catch(() => {
        if (active) setLoadedVersion(0)
      })

    return () => {
      active = false
    }
  }, [])

  const activeChild = useMemo(
    () => children.find((c) => c.id === activeChildId) ?? null,
    [children, activeChildId],
  )

  function setActiveChildId(id: string) {
    setActiveChildIdState(id)
    storeChildId(id)
  }

  return (
    <ActiveChildContext.Provider value={{ children, activeChild, setActiveChildId, loading }}>
      {reactChildren}
    </ActiveChildContext.Provider>
  )
}
