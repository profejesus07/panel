import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-neutral-50 px-4 text-center">
      <p className="text-sm font-semibold text-brand-700">Error 404</p>
      <h1 className="text-3xl font-bold text-neutral-900">Página no encontrada</h1>
      <p className="max-w-sm text-neutral-500">
        La página que buscas no existe o no tienes acceso a ella.
      </p>
      <Link to="/">
        <Button>Volver al inicio</Button>
      </Link>
    </div>
  )
}
