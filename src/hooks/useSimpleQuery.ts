import { useEffect, useState } from 'react'

// Igual que useListQuery pero para una carga simple sin paginación/filtros
// (p. ej. un catálogo completo). Mismo motivo: derivar `loading` de un
// contador de versión en vez de un setState síncrono en el efecto.
export function useSimpleQuery<T>(
  fetcher: () => Promise<T>,
  initialValue: T,
  onError?: (error: unknown) => void,
) {
  const [version, setVersion] = useState(0)
  const [data, setData] = useState<T>(initialValue)
  const [loadedVersion, setLoadedVersion] = useState<number | null>(null)
  const loading = loadedVersion !== version

  useEffect(() => {
    let active = true

    fetcher()
      .then((result) => {
        if (!active) return
        setData(result)
        setLoadedVersion(version)
      })
      .catch((error: unknown) => {
        if (!active) return
        onError?.(error)
        setLoadedVersion(version)
      })

    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version])

  return { data, loading, reload: () => setVersion((v) => v + 1) }
}
