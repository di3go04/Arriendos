'use client'

import { useLocale } from 'next-intl'
import { usePathname, useRouter } from '@/navigation'
import { useEffect, useRef, useState } from 'react'
import { Check, ChevronDown, Globe2 } from 'lucide-react'

const languages = [
  { codigo: 'es', nombre: 'Español',   flag: '/flags/es.svg' },
  { codigo: 'en', nombre: 'English',   flag: '/flags/gb.svg' },
  { codigo: 'fr', nombre: 'Français',  flag: '/flags/fr.svg' },
  { codigo: 'de', nombre: 'Deutsch',   flag: '/flags/de.svg' },
  { codigo: 'pt', nombre: 'Português', flag: '/flags/pt.svg' },
  { codigo: 'it', nombre: 'Italiano',  flag: '/flags/it.svg' },
]

export default function LanguageSelector() {
  const pathname = usePathname()
  const router = useRouter()
  const currentLocale = useLocale()
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false)
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEsc)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEsc)
    }
  }, [isOpen])

  function cambiarIdioma(codigo: string) {
    document.cookie = `RentNow_locale=${codigo}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`
    setIsOpen(false)
    router.push(pathname, { locale: codigo })
  }

  const idiomaActivo = languages.find((l) => l.codigo === currentLocale) ?? languages[0]

  return (
    <div ref={containerRef} className="relative inline-flex">
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="inline-flex items-center gap-2 rounded-xl border border-border-subtle bg-white/90 px-3 py-2 text-sm font-semibold text-brand-800 shadow-sm transition-all duration-300 hover:border-brand-200 hover:bg-brand-50 active:scale-[0.97] dark:border-white/10 dark:bg-white/5 dark:text-white/90 dark:hover:border-white/20 dark:hover:bg-white/10"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label="Seleccionar idioma"
      >
        <Globe2 className="h-4 w-4 text-text-muted dark:text-white/60" />
        <img
          src={idiomaActivo.flag}
          alt={idiomaActivo.nombre}
          className="w-5 h-3.5 rounded-sm object-cover shadow-sm"
          aria-hidden="true"
        />
        <span className="hidden sm:inline">{idiomaActivo.nombre}</span>
        <ChevronDown
          className={`h-4 w-4 text-text-muted transition-transform duration-300 dark:text-white/60 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div
          role="listbox"
          aria-label="Selector de idioma"
          className="absolute right-0 top-full z-50 mt-2 w-48 origin-top-right overflow-hidden rounded-xl border border-border-subtle bg-white py-1 shadow-elevated animate-scale-in dark:border-white/10 dark:bg-brand-900/95 dark:backdrop-blur-xl"
        >
          {languages.map(({ codigo, nombre, flag }) => {
            const activo = codigo === currentLocale
            return (
              <button
                key={codigo}
                type="button"
                onClick={() => cambiarIdioma(codigo)}
                role="option"
                aria-selected={activo}
                className={`flex w-full items-center gap-3 px-3 py-2.5 text-sm transition-colors duration-150 ${
                  activo
                    ? 'bg-brand-50 font-semibold text-brand-900 dark:bg-white/10 dark:text-white'
                    : 'text-brand-700 hover:bg-surface hover:text-brand-900 dark:text-white/60 dark:hover:bg-white/5 dark:hover:text-white/90'
                }`}
              >
                <img
                  src={flag}
                  alt={nombre}
                  className="w-5 h-3.5 rounded-sm object-cover shadow-sm flex-shrink-0"
                  aria-hidden="true"
                />
                <span className="flex-1 text-left">{nombre}</span>
                {activo && <Check className="h-4 w-4 text-amber-500 dark:text-amber-400" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
