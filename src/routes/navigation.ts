import {
  BarChart3,
  Bell,
  Building2,
  CalendarCheck,
  FileCheck2,
  FileSignature,
  FileText,
  GraduationCap,
  HeartHandshake,
  Home,
  LayoutDashboard,
  Megaphone,
  Settings,
  UserRound,
  Users,
  UsersRound,
  type LucideIcon,
} from 'lucide-react'

export interface NavItem {
  label: string
  segment: string
  icon: LucideIcon
}

export const ADMIN_NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', segment: '', icon: LayoutDashboard },
  { label: 'Institución', segment: 'institucion', icon: Building2 },
  { label: 'Estudiantes', segment: 'estudiantes', icon: Users },
  { label: 'Padres y acudientes', segment: 'padres', icon: UsersRound },
  { label: 'Cursos', segment: 'cursos', icon: GraduationCap },
  { label: 'Calificaciones', segment: 'calificaciones', icon: FileText },
  { label: 'Estadísticas', segment: 'estadisticas', icon: BarChart3 },
  { label: 'Asistencia', segment: 'asistencia', icon: CalendarCheck },
  { label: 'Justificaciones', segment: 'justificaciones', icon: FileCheck2 },
  { label: 'Convivencia', segment: 'convivencia', icon: HeartHandshake },
  { label: 'Actas', segment: 'actas', icon: FileSignature },
  { label: 'Anuncios', segment: 'anuncios', icon: Megaphone },
  { label: 'Boletines', segment: 'boletines', icon: FileText },
  { label: 'Configuración', segment: 'configuracion', icon: Settings },
]

export const STUDENT_NAV_ITEMS: NavItem[] = [
  { label: 'Inicio', segment: '', icon: Home },
  { label: 'Mi perfil', segment: 'perfil', icon: UserRound },
  { label: 'Mis calificaciones', segment: 'calificaciones', icon: FileText },
  { label: 'Mi asistencia', segment: 'asistencia', icon: CalendarCheck },
  { label: 'Mis observaciones', segment: 'observaciones', icon: HeartHandshake },
  { label: 'Mis actas', segment: 'actas', icon: FileSignature },
  { label: 'Anuncios', segment: 'anuncios', icon: Megaphone },
  { label: 'Justificaciones', segment: 'justificaciones', icon: FileCheck2 },
]

export const PARENT_NAV_ITEMS: NavItem[] = [
  { label: 'Inicio', segment: '', icon: Home },
  { label: 'Mis hijos', segment: 'hijos', icon: UsersRound },
  { label: 'Calificaciones', segment: 'calificaciones', icon: FileText },
  { label: 'Asistencia', segment: 'asistencia', icon: CalendarCheck },
  { label: 'Observaciones', segment: 'observaciones', icon: HeartHandshake },
  { label: 'Boletines', segment: 'boletines', icon: FileText },
  { label: 'Anuncios', segment: 'anuncios', icon: Bell },
  { label: 'Justificaciones', segment: 'justificaciones', icon: FileCheck2 },
]
