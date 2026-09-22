import { BookOpen, CalendarCheck, Inbox, Megaphone, UserRound, Users } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'

const stats = [
  { label: 'Estudiantes', value: 0, icon: Users },
  { label: 'Padres y acudientes', value: 0, icon: UserRound },
  { label: 'Cursos activos', value: 0, icon: BookOpen },
  { label: 'Asistencia de hoy', value: '—', icon: CalendarCheck },
  { label: 'Justificaciones pendientes', value: 0, icon: Inbox },
  { label: 'Anuncios activos', value: 0, icon: Megaphone },
]

export function DashboardPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900">Dashboard</h1>
        <p className="text-sm text-neutral-500">Resumen general de la institución.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="flex items-center gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                <stat.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-neutral-900">{stat.value}</p>
                <p className="text-sm text-neutral-500">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardContent>
            <h2 className="mb-4 text-sm font-semibold text-neutral-900">Actividad reciente</h2>
            <EmptyState
              title="Sin actividad todavía"
              description="Aquí verás los últimos eventos del sistema una vez que empieces a registrar información."
            />
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <h2 className="mb-4 text-sm font-semibold text-neutral-900">Anuncios activos</h2>
            <EmptyState
              title="No hay anuncios activos"
              description="Los anuncios institucionales publicados aparecerán aquí."
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
