import { Check, UsersRound } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { FullPageSpinner } from '@/components/ui/Spinner'
import { useActiveChild } from '@/hooks/useActiveChild'
import { courseLabel } from '@/services/courses.service'
import { studentFullName } from '@/services/students.service'
import { DOCUMENT_TYPE_LABELS, STUDENT_STATUS_LABELS } from '@/utils/labels'

export function ChildrenPage() {
  const { children, activeChild, setActiveChildId, loading } = useActiveChild()

  if (loading) return <FullPageSpinner />

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900">Mis hijos</h1>
        <p className="text-sm text-neutral-500">
          Estudiantes asociados a tu cuenta. Selecciona uno para consultar su información en las demás
          secciones.
        </p>
      </div>

      {children.length === 0 ? (
        <EmptyState
          icon={UsersRound}
          title="No tienes estudiantes vinculados"
          description="Contacta al administrador del colegio para que verifique tu cuenta."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {children.map((child) => {
            const isActive = child.id === activeChild?.id
            return (
              <button
                key={child.id}
                type="button"
                onClick={() => setActiveChildId(child.id)}
                className="text-left"
              >
                <Card className={isActive ? 'border-brand-400 ring-1 ring-brand-200' : ''}>
                  <CardContent>
                    <div className="mb-2 flex items-start justify-between">
                      <p className="font-semibold text-neutral-900">{studentFullName(child)}</p>
                      {isActive && (
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-700 text-white">
                          <Check className="h-3 w-3" />
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-neutral-500">
                      {child.document_number
                        ? `${DOCUMENT_TYPE_LABELS[child.document_type]} ${child.document_number}`
                        : 'Sin documento'}
                    </p>
                    <p className="text-sm text-neutral-500">
                      {child.courses ? courseLabel(child.courses) : 'Sin curso asignado'}
                    </p>
                    <p className="mt-1 text-xs text-neutral-400">{STUDENT_STATUS_LABELS[child.status]}</p>
                  </CardContent>
                </Card>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
