import { BookOpen, CalendarCheck, Inbox, Megaphone, UserRound, Users, type LucideIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import { useSimpleQuery } from '@/hooks/useSimpleQuery'
import { useToast } from '@/hooks/useToast'
import {
  getDashboardStats,
  listRecentActiveAnnouncements,
  type DashboardStats,
  type RecentAnnouncement,
} from '@/services/dashboard.service'

const EMPTY_STATS: DashboardStats = {
  studentsCount: 0,
  guardiansCount: 0,
  activeCoursesCount: 0,
  pendingJustificationsCount: 0,
  activeAnnouncementsCount: 0,
  attendanceToday: null,
}

function buildStatCards(stats: DashboardStats): { label: string; value: string; icon: LucideIcon }[] {
  return [
    { label: 'Estudiantes', value: stats.studentsCount.toLocaleString('es-CO'), icon: Users },
    { label: 'Padres y acudientes', value: stats.guardiansCount.toLocaleString('es-CO'), icon: UserRound },
    { label: 'Cursos activos', value: stats.activeCoursesCount.toLocaleString('es-CO'), icon: BookOpen },
    {
      label: 'Asistencia de hoy',
      value: stats.attendanceToday
        ? `${Math.round((stats.attendanceToday.present / stats.attendanceToday.total) * 100)}%`
        : 'Sin registrar',
      icon: CalendarCheck,
    },
    {
      label: 'Justificaciones pendientes',
      value: stats.pendingJustificationsCount.toLocaleString('es-CO'),
      icon: Inbox,
    },
    { label: 'Anuncios activos', value: stats.activeAnnouncementsCount.toLocaleString('es-CO'), icon: Megaphone },
  ]
}

export function DashboardPage() {
  const { showToast } = useToast()

  const { data: stats, loading: loadingStats } = useSimpleQuery(getDashboardStats, EMPTY_STATS, () =>
    showToast('error', 'No se pudieron cargar las estadísticas del dashboard.'),
  )
  const { data: announcements, loading: loadingAnnouncements } = useSimpleQuery(
    listRecentActiveAnnouncements,
    [] as RecentAnnouncement[],
    () => showToast('error', 'No se pudieron cargar los anuncios activos.'),
  )

  const statCards = buildStatCards(stats)

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900">Dashboard</h1>
        <p className="text-sm text-neutral-500">Resumen general de la institución.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {statCards.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="flex items-center gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                <stat.icon className="h-5 w-5" />
              </div>
              <div>
                {loadingStats ? (
                  <Skeleton className="h-7 w-14" />
                ) : (
                  <p className="text-2xl font-bold text-neutral-900">{stat.value}</p>
                )}
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
            {loadingAnnouncements ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : announcements.length === 0 ? (
              <EmptyState
                title="No hay anuncios activos"
                description="Los anuncios institucionales publicados aparecerán aquí."
              />
            ) : (
              <ul className="divide-y divide-neutral-200">
                {announcements.map((a) => (
                  <li key={a.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                    <span className="font-medium text-neutral-800">{a.title}</span>
                    <span className="shrink-0 text-xs text-neutral-400">
                      {new Date(a.publish_at).toLocaleDateString('es-CO')}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
