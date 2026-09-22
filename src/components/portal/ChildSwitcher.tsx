import { Users } from 'lucide-react'
import { useActiveChild } from '@/hooks/useActiveChild'
import { studentFullName } from '@/services/students.service'

export function ChildSwitcher() {
  const { children, activeChild, setActiveChildId, loading } = useActiveChild()

  if (loading || children.length <= 1) return null

  return (
    <div className="flex items-center gap-2 border-b border-neutral-200 bg-neutral-50 px-4 py-2.5 sm:px-6 lg:px-8">
      <Users className="h-4 w-4 shrink-0 text-neutral-400" />
      <span className="text-sm text-neutral-500">Viendo a:</span>
      <select
        value={activeChild?.id ?? ''}
        onChange={(e) => setActiveChildId(e.target.value)}
        className="rounded-md border-neutral-300 bg-white py-1 pl-2 pr-7 text-sm font-medium text-neutral-900 focus:border-brand-500 focus:ring-brand-100"
      >
        {children.map((child) => (
          <option key={child.id} value={child.id}>
            {studentFullName(child)}
          </option>
        ))}
      </select>
    </div>
  )
}
