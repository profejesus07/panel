import { useEffect, useState } from 'react'
import { getMyStudentRecord } from '@/services/myFamily.service'
import type { StudentWithCourse } from '@/services/students.service'

export function useMyStudentRecord() {
  const [student, setStudent] = useState<StudentWithCourse | null>(null)
  const [loadedVersion, setLoadedVersion] = useState<number | null>(null)
  const loading = loadedVersion !== 0

  useEffect(() => {
    let active = true
    getMyStudentRecord()
      .then((result) => {
        if (!active) return
        setStudent(result)
        setLoadedVersion(0)
      })
      .catch(() => {
        if (active) setLoadedVersion(0)
      })
    return () => {
      active = false
    }
  }, [])

  return { student, loading }
}
