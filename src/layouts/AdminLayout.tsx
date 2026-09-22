import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Navbar } from '@/components/layout/Navbar'
import { Sidebar } from '@/components/layout/Sidebar'
import { ADMIN_NAV_ITEMS } from '@/routes/navigation'

export function AdminLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-neutral-50">
      <Sidebar
        basePath="/admin"
        items={ADMIN_NAV_ITEMS}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />
      <div className="flex min-w-0 flex-1 flex-col print:block print:pl-0 lg:pl-64">
        <Navbar onOpenMobileMenu={() => setMobileOpen(true)} />
        <main className="flex-1 px-4 py-6 sm:px-6 print:p-0 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
