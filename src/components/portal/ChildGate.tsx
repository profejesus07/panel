import type { ReactNode } from 'react'
import { EmptyState } from '@/components/ui/EmptyState'
import { FullPageSpinner } from '@/components/ui/Spinner'
import { useActiveChild } from '@/hooks/useActiveChild'
import type { StudentWithCourse } from '@/services/students.service'

// Envuelve cada página del portal del padre: usa el hijo activo del
// ActiveChildProvider (compartido entre páginas) en vez de que cada una
// resuelva y seleccione un estudiante por su cuenta.
export function ChildGate({ children }: { children: (child: StudentWithCourse) => ReactNode }) {
  const { children: myChildren, activeChild, loading } = useActiveChild()

  if (loading) return <FullPageSpinner />

  if (myChildren.length === 0) {
    return (
      <EmptyState
        title="No tienes estudiantes vinculados"
        description="Contacta al administrador del colegio para que verifique tu cuenta."
      />
    )
  }

  if (!activeChild) return <FullPageSpinner />

  return <>{children(activeChild)}</>
}
