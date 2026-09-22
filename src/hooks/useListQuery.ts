import { useEffect, useState } from 'react'
import type { ListResult } from '@/types/common'

// Encapsula "cargar una lista paginada/filtrada" evitando el patrón prohibido
// de llamar a setState de forma síncrona en el cuerpo de un efecto: `loading`
// se deriva comparando la key de los parámetros actuales contra la key de la
// última carga completada, en vez de guardarse como estado aparte.
export function useListQuery<T, P>(
  params: P,
  fetcher: (params: P) => Promise<ListResult<T>>,
  onError?: (error: unknown) => void,
) {
  const [version, setVersion] = useState(0)
  const [data, setData] = useState<T[]>([])
  const [count, setCount] = useState(0)
  const [loadedKey, setLoadedKey] = useState<string | null>(null)

  const currentKey = JSON.stringify({ params, version })
  const loading = loadedKey !== currentKey

  useEffect(() => {
    let active = true

    fetcher(params)
      .then((result) => {
        if (!active) return
        setData(result.data)
        setCount(result.count)
        setLoadedKey(currentKey)
      })
      .catch((error: unknown) => {
        if (!active) return
        onError?.(error)
        setLoadedKey(currentKey)
      })

    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentKey])

  return { data, count, loading, reload: () => setVersion((v) => v + 1) }
}
