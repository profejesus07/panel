import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Navbar } from '@/components/layout/Navbar'
import { Sidebar } from '@/components/layout/Sidebar'
import { PARENT_NAV_ITEMS, STUDENT_NAV_ITEMS } from '@/routes/navigation'

export function PortalLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()
  const isStudent = location.pathname.startsWith('/estudiante')
  const basePath = isStudent ? '/estudiante' : '/padre'
  const items = isStudent ? STUDENT_NAV_ITEMS : PARENT_NAV_ITEMS

  return (
    <div className="flex min-h-screen bg-neutral-50">
      <Sidebar
        basePath={basePath}
        items={items}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />
      <div className="flex min-w-0 flex-1 flex-col lg:pl-64">
        <Navbar onOpenMobileMenu={() => setMobileOpen(true)} />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
