import { StudentGate } from '@/components/portal/StudentGate'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { courseLabel } from '@/services/courses.service'
import type { StudentWithCourse } from '@/services/students.service'
import { formatDocument, STUDENT_STATUS_LABELS } from '@/utils/labels'

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-neutral-500">{label}</p>
      <p className="text-sm font-medium text-neutral-900">{value || '—'}</p>
    </div>
  )
}

export function ProfilePage() {
  return <StudentGate>{(student) => <ProfileContent student={student} />}</StudentGate>
}

function ProfileContent({ student }: { student: StudentWithCourse }) {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900">Mi perfil</h1>
        <p className="text-sm text-neutral-500">Tu información registrada en el colegio.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Datos personales</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Nombres" value={student.first_name} />
          <Field label="Apellidos" value={student.last_name} />
          <Field
            label="Documento"
            value={formatDocument(student.document_type, student.document_number) ?? 'Sin documento'}
          />
          <Field label="Fecha de nacimiento" value={student.birth_date ?? ''} />
          <Field label="Código estudiantil" value={student.student_code} />
          <Field label="Curso" value={student.courses ? courseLabel(student.courses) : 'Sin asignar'} />
          <Field label="Estado" value={STUDENT_STATUS_LABELS[student.status]} />
          <Field label="Fecha de ingreso" value={student.enrollment_date} />
          <Field label="Dirección" value={student.address ?? ''} />
          <Field label="Teléfono" value={student.phone ?? ''} />
          <Field label="Correo" value={student.email ?? ''} />
        </CardContent>
      </Card>
    </div>
  )
}
