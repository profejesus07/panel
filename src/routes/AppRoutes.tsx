import type { ComponentType } from 'react'
import { Route, Routes } from 'react-router-dom'
import { AdminLayout } from '@/layouts/AdminLayout'
import { AuthLayout } from '@/layouts/AuthLayout'
import { PortalLayout } from '@/layouts/PortalLayout'
import { ComingSoonPage } from '@/pages/ComingSoonPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { ConfigurationPage } from '@/pages/admin/ConfigurationPage'
import { CoursesPage } from '@/pages/admin/CoursesPage'
import { AttendancePage } from '@/pages/admin/AttendancePage'
import { DashboardPage } from '@/pages/admin/DashboardPage'
import { GradesPage } from '@/pages/admin/GradesPage'
import { GuardiansPage } from '@/pages/admin/GuardiansPage'
import { InstitutionPage } from '@/pages/admin/InstitutionPage'
import { JustificationsPage } from '@/pages/admin/JustificationsPage'
import { StudentsPage } from '@/pages/admin/StudentsPage'
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage'
import { LoginPage } from '@/pages/auth/LoginPage'
import { ResetPasswordPage } from '@/pages/auth/ResetPasswordPage'
import { ADMIN_NAV_ITEMS, PARENT_NAV_ITEMS, STUDENT_NAV_ITEMS } from '@/routes/navigation'
import { ProtectedRoute } from '@/routes/ProtectedRoute'
import { RoleHomeRedirect } from '@/routes/RoleHomeRedirect'
import { RoleRoute } from '@/routes/RoleRoute'

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
            {STUDENT_NAV_ITEMS.map((item) => (
              <Route
                key={item.segment || 'index'}
                index={item.segment === ''}
                path={item.segment || undefined}
                element={<ComingSoonPage title={item.label} />}
              />
            ))}
          </Route>
        </Route>

        <Route element={<RoleRoute allowed={['padre']} />}>
          <Route path="/padre" element={<PortalLayout />}>
            {PARENT_NAV_ITEMS.map((item) => (
              <Route
                key={item.segment || 'index'}
                index={item.segment === ''}
                path={item.segment || undefined}
                element={<ComingSoonPage title={item.label} />}
              />
            ))}
          </Route>
        </Route>

        <Route path="/" element={<RoleHomeRedirect />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
