// Emblema de la plataforma: birrete sobre un escudo con borla dorada.
export function BrandLogo() {
  return (
    <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 via-brand-700 to-brand-900 shadow-lg shadow-black/30 ring-1 ring-accent-300/40">
      <svg viewBox="0 0 32 32" className="h-6 w-6" fill="none" aria-hidden="true">
        <path
          d="M16 29c-5.5-2-9-6-9-11.5V13l9-3.2 9 3.2v4.5c0 5.5-3.5 9.5-9 11.5Z"
          fill="white"
          fillOpacity="0.12"
          stroke="white"
          strokeOpacity="0.35"
          strokeWidth="1"
        />
        <path d="M16 4 29 9.5 16 15 3 9.5 16 4Z" fill="white" />
        <path
          d="M8.5 12v5.2S11.2 20 16 20s7.5-2.8 7.5-2.8V12"
          stroke="white"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M26.5 10.6v6.4" stroke="#fcd34d" strokeWidth="1.6" strokeLinecap="round" />
        <circle cx="26.5" cy="18.4" r="1.6" fill="#fbbf24" />
      </svg>
    </div>
  )
}
