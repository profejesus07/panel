import type { ReactNode } from 'react'
import { EmptyState } from '@/components/ui/EmptyState'
import { FullPageSpinner } from '@/components/ui/Spinner'
import { useMyStudentRecord } from '@/hooks/useMyStudentRecord'
import type { StudentWithCourse } from '@/services/students.service'

// Envuelve cada página del portal del estudiante: resuelve su propio
// registro una sola vez y evita repetir el estado de carga/vacío en cada una.
export function StudentGate({ children }: { children: (student: StudentWithCourse) => ReactNode }) {
  const { student, loading } = useMyStudentRecord()

  if (loading) return <FullPageSpinner />

  if (!student) {
    return (
      <EmptyState
        title="No encontramos tu información de estudiante"
        description="Contacta al administrador del colegio para que verifique tu cuenta."
      />
    )
  }

  return <>{children(student)}</>
}
