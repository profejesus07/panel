import type { ReactNode } from 'react'
import docenteImg from '@/assets/docente.webp'

interface WelcomeBannerProps {
  title: string
  description: ReactNode
}

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Buenos días'
  if (hour < 19) return 'Buenas tardes'
  return 'Buenas noches'
}

// Encabezado de bienvenida con la imagen del docente, compartido por el
// dashboard y las páginas de inicio de los portales. `title` es el nombre a
// saludar (o vacío para un saludo genérico).
export function WelcomeBanner({ title, description }: WelcomeBannerProps) {
  const greeting = getGreeting()
  const today = new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <section className="relative mb-6 overflow-hidden rounded-2xl bg-gradient-to-br from-brand-950 via-brand-800 to-brand-600 shadow-lg">
      <div className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full bg-accent-400/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 left-1/3 h-56 w-56 rounded-full bg-brand-400/20 blur-3xl" />

      <div className="relative flex items-end">
        <div className="min-w-0 flex-1 py-7 pl-6 pr-2 sm:px-8 sm:py-9">
          <p className="text-xs font-semibold uppercase tracking-widest text-accent-300">{today}</p>
          <h1 className="mt-2 text-2xl font-bold text-white sm:text-3xl">
            {greeting}
            {title ? `, ${title}` : ''}
          </h1>
          <div className="mt-2 max-w-md text-sm text-brand-100/80">{description}</div>
        </div>
        <img
          src={docenteImg}
          alt=""
          className="h-36 w-auto shrink-0 self-end pr-2 drop-shadow-2xl sm:h-52 sm:pr-6 lg:h-60 lg:pr-10"
        />
      </div>
    </section>
  )
}
