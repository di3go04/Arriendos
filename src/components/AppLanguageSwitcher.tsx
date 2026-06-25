'use client'

/**
 * AppLanguageSwitcher
 *
 * Selector de idioma para las páginas de la app (dashboard, properties, etc.)
 * que están FUERA del [locale] layout y por lo tanto no tienen contexto de
 * next-intl. Funciona leyendo/escribiendo la cookie RentNow_locale directamente
 * y recargando la página para aplicar el nuevo idioma.
 *
 * DROPDOWN VÍA PORTAL:
 * El menú se monta en document.body mediante ReactDOM.createPortal para que
 * jamás quede recortado por overflow:hidden/auto de un ancestro (sidebar, nav,
 * etc.). La posición se calcula con getBoundingClientRect() + scrollY.
 */

import { Check, ChevronDown, Globe2 } from 'lucide-react'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

const LANGUAGES = [
  { code: 'es', label: 'Español',   flag: '/flags/es.svg' },
  { code: 'en', label: 'English',   flag: '/flags/gb.svg' },
  { code: 'fr', label: 'Français',  flag: '/flags/fr.svg' },
  { code: 'de', label: 'Deutsch',   flag: '/flags/de.svg' },
  { code: 'pt', label: 'Português', flag: '/flags/pt.svg' },
  { code: 'it', label: 'Italiano',  flag: '/flags/it.svg' },
]

function getActiveLangFromCookie(): string {
  if (typeof document === 'undefined') return 'es'
  const match = document.cookie.match(/(?:^|;\s*)RentNow_locale=([^;]+)/)
  return match?.[1] ?? 'es'
}

interface DropdownPos {
  top: number
  left: number
  width: number
  openUp: boolean   // true → abrir hacia arriba cuando no cabe abajo
}

interface Props {
  /** collapsed=true → solo muestra bandera, sin texto (para sidebar colapsado) */
  collapsed?: boolean
}

export default function AppLanguageSwitcher({ collapsed = false }: Props) {
  const [activeCode, setActiveCode] = useState('es')
  const [open, setOpen]             = useState(false)
  const [pos, setPos]               = useState<DropdownPos | null>(null)
  const [mounted, setMounted]       = useState(false)
  const btnRef                      = useRef<HTMLButtonElement>(null)

  // Sólo montar portal en el cliente
  useEffect(() => { setMounted(true) }, [])

  // Leer cookie en cliente (evita mismatch SSR)
  useEffect(() => { setActiveCode(getActiveLangFromCookie()) }, [])

  // Calcular posición del dropdown en coordenadas de ventana
  useLayoutEffect(() => {
    if (!open || !btnRef.current) return

    const rect = btnRef.current.getBoundingClientRect()
    const dropdownH = LANGUAGES.length * 44 + 8  // estimación altura dropdown
    const spaceBelow = window.innerHeight - rect.bottom
    const openUp = spaceBelow < dropdownH && rect.top > dropdownH

    setPos({
      top:    openUp
        ? rect.top + window.scrollY - dropdownH - 4
        : rect.bottom + window.scrollY + 4,
      left:   Math.max(8, rect.right + window.scrollX - 176), // 176 = w-44
      width:  176,
      openUp,
    })
  }, [open])

  // Cerrar al click fuera o al scroll
  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent) => {
      if (btnRef.current && !btnRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    const closeOnScroll = () => setOpen(false)
    document.addEventListener('mousedown', close)
    window.addEventListener('scroll', closeOnScroll, true)
    return () => {
      document.removeEventListener('mousedown', close)
      window.removeEventListener('scroll', closeOnScroll, true)
    }
  }, [open])

  const active = LANGUAGES.find(l => l.code === activeCode) ?? LANGUAGES[0]

  function switchLang(code: string) {
    document.cookie = `RentNow_locale=${code}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`
    setOpen(false)
    window.location.reload()
  }

  const dropdown = open && pos && mounted ? createPortal(
    <div
      role="listbox"
      aria-label="Idioma"
      style={{
        position: 'absolute',
        top:      pos.top,
        left:     pos.left,
        width:    pos.width,
        zIndex:   99999,
      }}
      className="overflow-hidden rounded-xl border border-border bg-card py-1 shadow-xl
                 animate-in fade-in zoom-in-95 duration-100"
    >
      {LANGUAGES.map(({ code, label, flag }) => {
        const isActive = code === activeCode
        return (
          <button
            key={code}
            type="button"
            role="option"
            aria-selected={isActive}
            onMouseDown={(e) => {
              // mousedown antes que el blur del botón → evita parpadeo
              e.preventDefault()
              switchLang(code)
            }}
            className={`flex w-full items-center gap-3 px-3 py-2.5 text-sm transition-colors duration-100
              ${isActive
                ? 'bg-primary/10 font-semibold text-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
          >
            <img
              src={flag}
              alt={label}
              className="w-5 h-3.5 rounded-sm object-cover shadow-sm shrink-0"
              aria-hidden="true"
            />
            <span className="flex-1 text-left">{label}</span>
            {isActive && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
          </button>
        )
      })}
    </div>,
    document.body
  ) : null

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen(v => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Seleccionar idioma"
        className={`inline-flex items-center gap-1.5 rounded-lg border border-border
          bg-transparent px-2 py-1.5 text-xs font-semibold text-muted-foreground
          hover:bg-muted hover:text-foreground transition-all duration-200
          focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring
          ${open ? 'bg-muted text-foreground' : ''}`}
      >
        <Globe2 className="h-3.5 w-3.5 shrink-0" />
        <img
          src={active.flag}
          alt={active.label}
          className="w-5 h-3.5 rounded-sm object-cover shadow-sm shrink-0"
          aria-hidden="true"
        />
        {!collapsed && (
          <>
            <span className="hidden lg:inline">{active.label}</span>
            <ChevronDown
              className={`h-3 w-3 shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
            />
          </>
        )}
      </button>

      {dropdown}
    </>
  )
}
