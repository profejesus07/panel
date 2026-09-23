import { clsx } from 'clsx'

export interface TabItem {
  key: string
  label: string
}

interface TabsProps {
  tabs: TabItem[]
  active: string
  onChange: (key: string) => void
}

export function Tabs({ tabs, active, onChange }: TabsProps) {
  return (
    <div className="border-b border-neutral-200">
      <nav className="-mb-px flex gap-6" aria-label="Tabs">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => onChange(tab.key)}
            className={clsx(
              'border-b-2 px-1 py-3 text-sm font-medium transition-colors',
              active === tab.key
                ? 'border-brand-600 font-semibold text-brand-700'
                : 'border-transparent text-neutral-500 hover:border-neutral-300 hover:text-neutral-700',
            )}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  )
}
