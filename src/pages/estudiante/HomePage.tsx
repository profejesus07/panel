import { CalendarCheck, FileText, HeartHandshake, Megaphone } from 'lucide-react'
import { Link } from 'react-router-dom'
import { StudentGate } from '@/components/portal/StudentGate'
import { Card, CardContent } from '@/components/ui/Card'
import { WelcomeBanner } from '@/components/ui/WelcomeBanner'
import { useAuth } from '@/hooks/useAuth'
import { courseLabel } from '@/services/courses.service'
import type { StudentWithCourse } from '@/services/students.service'
import { STUDENT_STATUS_LABELS } from '@/utils/labels'

const QUICK_LINKS = [
  { label: 'Mis calificaciones', href: '/estudiante/calificaciones', icon: FileText },
  { label: 'Mi asistencia', href: '/estudiante/asistencia', icon: CalendarCheck },
  { label: 'Mis observaciones', href: '/estudiante/observaciones', icon: HeartHandshake },
  { label: 'Anuncios', href: '/estudiante/anuncios', icon: Megaphone },
]

export function HomePage() {
  const { profile } = useAuth()

  // El banner va fuera de StudentGate para que se vea aunque el registro del
  // estudiante todavía no esté vinculado a la cuenta.
  return (
    <div>
      <WelcomeBanner
        title={profile?.fullName.split(' ')[0] ?? ''}
        description="Consulta tus calificaciones, tu asistencia y los anuncios del colegio."
      />
      <StudentGate>{(student) => <HomeContent student={student} />}</StudentGate>
    </div>
  )
}

function HomeContent({ student }: { student: StudentWithCourse }) {
  return (
    <div>
      <p className="mb-4 text-sm font-medium text-neutral-600">
        {student.courses ? courseLabel(student.courses) : 'Sin curso asignado'} ·{' '}
        {STUDENT_STATUS_LABELS[student.status]}
      </p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {QUICK_LINKS.map((link) => (
          <Link key={link.href} to={link.href}>
            <Card className="h-full transition-colors hover:border-brand-300">
              <CardContent className="flex flex-col items-center gap-2 py-6 text-center">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                  <link.icon className="h-5 w-5" />
                </div>
                <p className="text-sm font-medium text-neutral-900">{link.label}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
