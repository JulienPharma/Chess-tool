import { useTheme } from '@/state/theme'

export function ThemeToggle() {
  const { theme, toggle } = useTheme()
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === 'dark' ? 'Passer en thème clair' : 'Passer en thème sombre'}
      className="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm transition hover:border-accent"
    >
      {theme === 'dark' ? '☀︎ Clair' : '☾ Sombre'}
    </button>
  )
}
