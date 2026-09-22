import type { ComponentType } from 'react'
import { Route, Routes } from 'react-router-dom'
import { ActiveChildProvider } from '@/contexts/ActiveChildContext'
import { AdminLayout } from '@/layouts/AdminLayout'
import { AuthLayout } from '@/layouts/AuthLayout'
import { PortalLayout } from '@/layouts/PortalLayout'
import { ComingSoonPage } from '@/pages/ComingSoonPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { AnnouncementsPage } from '@/pages/admin/AnnouncementsPage'
import { AttendancePage } from '@/pages/admin/AttendancePage'
import { BehaviorRecordsPage } from '@/pages/admin/BehaviorRecordsPage'
import { ConfigurationPage } from '@/pages/admin/ConfigurationPage'
import { CoursesPage } from '@/pages/admin/CoursesPage'
import { DashboardPage } from '@/pages/admin/DashboardPage'
import { GradesPage } from '@/pages/admin/GradesPage'
import { GuardiansPage } from '@/pages/admin/GuardiansPage'
import { InstitutionPage } from '@/pages/admin/InstitutionPage'
import { JustificationsPage } from '@/pages/admin/JustificationsPage'
import { OfficialRecordsPage } from '@/pages/admin/OfficialRecordsPage'
import { ReportCardsPage } from '@/pages/admin/ReportCardsPage'
import { StudentsPage } from '@/pages/admin/StudentsPage'
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage'
import { LoginPage } from '@/pages/auth/LoginPage'
import { ResetPasswordPage } from '@/pages/auth/ResetPasswordPage'
import * as EstudiantePages from '@/pages/estudiante'
import * as PadrePages from '@/pages/padre'
import { ADMIN_NAV_ITEMS, PARENT_NAV_ITEMS, STUDENT_NAV_ITEMS } from '@/routes/navigation'
import { ProtectedRoute } from '@/routes/ProtectedRoute'
import { RoleHomeRedirect } from '@/routes/RoleHomeRedirect'
import { RoleRoute } from '@/routes/RoleRoute'

const STUDENT_PAGES: Partial<Record<string, ComponentType>> = {
  '': EstudiantePages.HomePage,
  perfil: EstudiantePages.ProfilePage,
  calificaciones: EstudiantePages.GradesPage,
  asistencia: EstudiantePages.AttendancePage,
  observaciones: EstudiantePages.BehaviorPage,
  actas: EstudiantePages.OfficialRecordsPage,
  anuncios: EstudiantePages.AnnouncementsPage,
  justificaciones: EstudiantePages.JustificationsPage,
}

const PARENT_PAGES: Partial<Record<string, ComponentType>> = {
  '': PadrePages.HomePage,
  hijos: PadrePages.ChildrenPage,
  calificaciones: PadrePages.GradesPage,
  asistencia: PadrePages.AttendancePage,
  observaciones: PadrePages.BehaviorPage,
  boletines: PadrePages.ReportCardsPage,
  anuncios: PadrePages.AnnouncementsPage,
  justificaciones: PadrePages.JustificationsPage,
}

// Módulos de administración ya implementados, por segmento de ruta. Los que
// falten en este mapa se muestran como "en construcción" hasta su fase.
const ADMIN_PAGES: Partial<Record<string, ComponentType>> = {
  institucion: InstitutionPage,
  estudiantes: StudentsPage,
  padres: GuardiansPage,
  cursos: CoursesPage,
  configuracion: ConfigurationPage,
  calificaciones: GradesPage,
  asistencia: AttendancePage,
  justificaciones: JustificationsPage,
  convivencia: BehaviorRecordsPage,
  actas: OfficialRecordsPage,
  anuncios: AnnouncementsPage,
  boletines: ReportCardsPage,
}

export function AppRoutes() {
  return (
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
  )
}
