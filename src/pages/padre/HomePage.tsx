import { CalendarCheck, FileBarChart, FileText, HeartHandshake } from 'lucide-react'
import { Link } from 'react-router-dom'
import { ChildGate } from '@/components/portal/ChildGate'
import { Card, CardContent } from '@/components/ui/Card'
import { WelcomeBanner } from '@/components/ui/WelcomeBanner'
import { useAuth } from '@/hooks/useAuth'
import { courseLabel } from '@/services/courses.service'
import { studentFullName, type StudentWithCourse } from '@/services/students.service'
import { STUDENT_STATUS_LABELS } from '@/utils/labels'

const QUICK_LINKS = [
  { label: 'Calificaciones', href: '/padre/calificaciones', icon: FileText },
  { label: 'Asistencia', href: '/padre/asistencia', icon: CalendarCheck },
  { label: 'Observaciones', href: '/padre/observaciones', icon: HeartHandshake },
  { label: 'Boletines', href: '/padre/boletines', icon: FileBarChart },
]

export function HomePage() {
  const { profile } = useAuth()

  // El banner va fuera de ChildGate para que se vea aunque todavía no haya
  // un hijo vinculado a la cuenta.
  return (
    <div>
      <WelcomeBanner
        title={profile?.fullName.split(' ')[0] ?? ''}
        description="Acompaña el proceso escolar de tu hijo o hija desde aquí."
      />
      <ChildGate>{(child) => <HomeContent child={child} />}</ChildGate>
    </div>
  )
}

function HomeContent({ child }: { child: StudentWithCourse }) {
  return (
    <div>
      <p className="mb-4 text-sm font-medium text-neutral-600">
        Información de {studentFullName(child)} —{' '}
        {child.courses ? courseLabel(child.courses) : 'Sin curso asignado'} ·{' '}
        {STUDENT_STATUS_LABELS[child.status]}
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
