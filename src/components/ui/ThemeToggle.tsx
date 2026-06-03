'use client'

import { Moon, Sun } from 'lucide-react'
import { useTheme } from '@/context/ThemeContext'
import { useEffect, useState } from 'react'

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => { // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true) }, [])

  if (!mounted) return <div className="h-9 w-9" />

  return (
    <button
      onClick={toggleTheme}
      className="relative inline-flex h-9 w-9 items-center justify-center rounded-full bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 shadow-sm transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-700"
      aria-label={theme === 'dark' ? 'Activar modo claro' : 'Activar modo oscuro'}
    >
      {theme === 'dark' ? (
        <Sun className="h-[1.2rem] w-[1.2rem] text-amber-400" />
      ) : (
        <Moon className="h-[1.2rem] w-[1.2rem] text-slate-600" />
      )}
    </button>
  )
}
