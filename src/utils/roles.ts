import type { UserRole } from '@/types/database.types'

export function homePathForRole(role: UserRole): string {
  switch (role) {
    case 'admin':
      return '/admin'
    case 'estudiante':
      return '/estudiante'
    case 'padre':
      return '/padre'
  }
}
