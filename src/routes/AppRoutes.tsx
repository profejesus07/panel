import { lazy, Suspense, type ComponentType } from 'react'
import { Route, Routes } from 'react-router-dom'
import { FullPageSpinner } from '@/components/ui/Spinner'
import { ActiveChildProvider } from '@/contexts/ActiveChildContext'
import { AdminLayout } from '@/layouts/AdminLayout'
import { AuthLayout } from '@/layouts/AuthLayout'
import { PortalLayout } from '@/layouts/PortalLayout'
import { ComingSoonPage } from '@/pages/ComingSoonPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage'
import { LoginPage } from '@/pages/auth/LoginPage'
import { ResetPasswordPage } from '@/pages/auth/ResetPasswordPage'
import { ADMIN_NAV_ITEMS, PARENT_NAV_ITEMS, STUDENT_NAV_ITEMS } from '@/routes/navigation'
import { ProtectedRoute } from '@/routes/ProtectedRoute'
import { RoleHomeRedirect } from '@/routes/RoleHomeRedirect'
import { RoleRoute } from '@/routes/RoleRoute'

// Cada módulo se descarga solo la primera vez que se visita, y el admin, el
// estudiante y el padre nunca descargan el código de los otros dos roles:
// nadie visita ambos árboles de rutas en la misma sesión (RoleRoute ya lo
// impide), así que no tiene sentido incluirlos en el bundle inicial.
const DashboardPage = lazy(() => import('@/pages/admin/DashboardPage').then((m) => ({ default: m.DashboardPage })))
const InstitutionPage = lazy(() => import('@/pages/admin/InstitutionPage').then((m) => ({ default: m.InstitutionPage })))
const StudentsPage = lazy(() => import('@/pages/admin/StudentsPage').then((m) => ({ default: m.StudentsPage })))
const GuardiansPage = lazy(() => import('@/pages/admin/GuardiansPage').then((m) => ({ default: m.GuardiansPage })))
const CoursesPage = lazy(() => import('@/pages/admin/CoursesPage').then((m) => ({ default: m.CoursesPage })))
const ConfigurationPage = lazy(() => import('@/pages/admin/ConfigurationPage').then((m) => ({ default: m.ConfigurationPage })))
const AdminGradesPage = lazy(() => import('@/pages/admin/GradesPage').then((m) => ({ default: m.GradesPage })))
const AdminStatisticsPage = lazy(() => import('@/pages/admin/StatisticsPage').then((m) => ({ default: m.StatisticsPage })))
const AdminAttendancePage = lazy(() => import('@/pages/admin/AttendancePage').then((m) => ({ default: m.AttendancePage })))
const AdminJustificationsPage = lazy(() => import('@/pages/admin/JustificationsPage').then((m) => ({ default: m.JustificationsPage })))
const BehaviorRecordsPage = lazy(() => import('@/pages/admin/BehaviorRecordsPage').then((m) => ({ default: m.BehaviorRecordsPage })))
const OfficialRecordsPage = lazy(() => import('@/pages/admin/OfficialRecordsPage').then((m) => ({ default: m.OfficialRecordsPage })))
const AdminAnnouncementsPage = lazy(() => import('@/pages/admin/AnnouncementsPage').then((m) => ({ default: m.AnnouncementsPage })))
const AdminReportCardsPage = lazy(() => import('@/pages/admin/ReportCardsPage').then((m) => ({ default: m.ReportCardsPage })))

const EstudianteHomePage = lazy(() => import('@/pages/estudiante').then((m) => ({ default: m.HomePage })))
const EstudianteProfilePage = lazy(() => import('@/pages/estudiante').then((m) => ({ default: m.ProfilePage })))
const EstudianteGradesPage = lazy(() => import('@/pages/estudiante').then((m) => ({ default: m.GradesPage })))
const EstudianteAttendancePage = lazy(() => import('@/pages/estudiante').then((m) => ({ default: m.AttendancePage })))
const EstudianteBehaviorPage = lazy(() => import('@/pages/estudiante').then((m) => ({ default: m.BehaviorPage })))
const EstudianteOfficialRecordsPage = lazy(() => import('@/pages/estudiante').then((m) => ({ default: m.OfficialRecordsPage })))
const EstudianteAnnouncementsPage = lazy(() => import('@/pages/estudiante').then((m) => ({ default: m.AnnouncementsPage })))
const EstudianteJustificationsPage = lazy(() => import('@/pages/estudiante').then((m) => ({ default: m.JustificationsPage })))

const PadreHomePage = lazy(() => import('@/pages/padre').then((m) => ({ default: m.HomePage })))
const PadreChildrenPage = lazy(() => import('@/pages/padre').then((m) => ({ default: m.ChildrenPage })))
const PadreGradesPage = lazy(() => import('@/pages/padre').then((m) => ({ default: m.GradesPage })))
const PadreAttendancePage = lazy(() => import('@/pages/padre').then((m) => ({ default: m.AttendancePage })))
const PadreBehaviorPage = lazy(() => import('@/pages/padre').then((m) => ({ default: m.BehaviorPage })))
const PadreReportCardsPage = lazy(() => import('@/pages/padre').then((m) => ({ default: m.ReportCardsPage })))
const PadreAnnouncementsPage = lazy(() => import('@/pages/padre').then((m) => ({ default: m.AnnouncementsPage })))
const PadreJustificationsPage = lazy(() => import('@/pages/padre').then((m) => ({ default: m.JustificationsPage })))

// Módulos de administración ya implementados, por segmento de ruta. Los que
// falten en este mapa se muestran como "en construcción" hasta su fase.
const ADMIN_PAGES: Partial<Record<string, ComponentType>> = {
  institucion: InstitutionPage,
  estudiantes: StudentsPage,
  padres: GuardiansPage,
  cursos: CoursesPage,
  configuracion: ConfigurationPage,
  calificaciones: AdminGradesPage,
  estadisticas: AdminStatisticsPage,
  asistencia: AdminAttendancePage,
  justificaciones: AdminJustificationsPage,
  convivencia: BehaviorRecordsPage,
  actas: OfficialRecordsPage,
  anuncios: AdminAnnouncementsPage,
  boletines: AdminReportCardsPage,
}

const STUDENT_PAGES: Partial<Record<string, ComponentType>> = {
  '': EstudianteHomePage,
  perfil: EstudianteProfilePage,
  calificaciones: EstudianteGradesPage,
  asistencia: EstudianteAttendancePage,
  observaciones: EstudianteBehaviorPage,
  actas: EstudianteOfficialRecordsPage,
  anuncios: EstudianteAnnouncementsPage,
  justificaciones: EstudianteJustificationsPage,
}

const PARENT_PAGES: Partial<Record<string, ComponentType>> = {
  '': PadreHomePage,
  hijos: PadreChildrenPage,
  calificaciones: PadreGradesPage,
  asistencia: PadreAttendancePage,
  observaciones: PadreBehaviorPage,
  boletines: PadreReportCardsPage,
  anuncios: PadreAnnouncementsPage,
  justificaciones: PadreJustificationsPage,
}

export function AppRoutes() {
  return (
    <Suspense fallback={<FullPageSpinner />}>
      <Routes>
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/recuperar-password" element={<ForgotPasswordPage />} />
          <Route path="/recuperar-password/confirmar" element={<ResetPasswordPage />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route element={<RoleRoute allowed={['admin']} />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<DashboardPage />} />
              {ADMIN_NAV_ITEMS.filter((item) => item.segment !== '').map((item) => {
                const Page = ADMIN_PAGES[item.segment]
                return (
                  <Route
                    key={item.segment}
                    path={item.segment}
                    element={Page ? <Page /> : <ComingSoonPage title={item.label} />}
                  />
                )
              })}
            </Route>
          </Route>

          <Route element={<RoleRoute allowed={['estudiante']} />}>
            <Route path="/estudiante" element={<PortalLayout />}>
              {STUDENT_NAV_ITEMS.map((item) => {
                const Page = STUDENT_PAGES[item.segment]
                return (
                  <Route
                    key={item.segment || 'index'}
                    index={item.segment === ''}
                    path={item.segment || undefined}
                    element={Page ? <Page /> : <ComingSoonPage title={item.label} />}
                  />
                )
              })}
            </Route>
          </Route>

          <Route element={<RoleRoute allowed={['padre']} />}>
            <Route
              path="/padre"
              element={
                <ActiveChildProvider>
                  <PortalLayout />
                </ActiveChildProvider>
              }
            >
              {PARENT_NAV_ITEMS.map((item) => {
                const Page = PARENT_PAGES[item.segment]
                return (
                  <Route
                    key={item.segment || 'index'}
                    index={item.segment === ''}
                    path={item.segment || undefined}
                    element={Page ? <Page /> : <ComingSoonPage title={item.label} />}
                  />
                )
              })}
            </Route>
          </Route>

          <Route path="/" element={<RoleHomeRedirect />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  )
}
