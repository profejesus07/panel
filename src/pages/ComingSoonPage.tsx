import { Construction } from 'lucide-react'
import { EmptyState } from '@/components/ui/EmptyState'

export function ComingSoonPage({ title }: { title: string }) {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-neutral-900">{title}</h1>
      <EmptyState
        icon={Construction}
        title="Módulo en construcción"
        description="Esta sección se habilitará en una próxima fase del proyecto."
      />
    </div>
  )
}
