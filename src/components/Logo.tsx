'use client'

import { useTheme } from 'next-themes'
import { Link } from '@/navigation'
import { useEffect, useState } from 'react'

interface LogoProps {
  width?: number
  height?: number
  className?: string
  theme?: 'light' | 'dark'
  variant?: 'full' | 'icon'
  href?: string
  onClick?: () => void
}

export function Logo({
  width,
  height = 40,           // 40px — altura estándar para navbar
  className = '',
  theme: explicitTheme,
  variant = 'full',
  href = '/',
  onClick,
}: LogoProps) {
  const { theme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const currentTheme =
    explicitTheme ||
    (mounted ? (theme === 'system' ? resolvedTheme : theme) : 'light')
  const isDark = currentTheme === 'dark'

  // Rutas absolutas desde /public — funcionan en cualquier ruta i18n
  // (/es/precios, /en/dashboard, etc.) porque no dependen del path actual.
  const src = isDark ? '/logo-light.svg' : '/logo.svg'

  const iconSize = variant === 'icon' ? 28 : height
  const explicitWidth = variant === 'icon' ? undefined : width

  // Usamos <img> nativo en lugar de next/image para SVGs con viewBox variable.
  //
  // ¿Por qué no next/image aquí?
  // next/image requiere width Y height numéricos explícitos y los usa para
  // reservar espacio en el layout. Si luego CSS cambia uno pero no el otro
  // (p.ej. height:28px + className="w-auto"), Next.js lanza el warning:
  // "has either width or height modified, but not the other".
  //
  // Con <img> nativo:
  // - height fija la altura en px
  // - width: auto deja que el navegador calcule el ancho respetando el
  //   viewBox del SVG → sin distorsión, sin warning
  // - La ruta /logo.svg es absoluta desde /public y funciona en todos
  //   los prefijos de idioma (/es/, /en/, /pt/, etc.)
  const img = (
    <img
      src={src}
      alt="RentNow logo"           // accesibilidad + SEO
      height={iconSize}
      style={{
        height: iconSize,
        width: explicitWidth ?? 'auto',  // auto respeta viewBox → sin warning de consola
        display: 'block',                // elimina baseline gap (4px fantasma)
        verticalAlign: 'middle',         // alineación centrada con botones del navbar
      }}
      fetchPriority="high"
      decoding="sync"
    />
  )

  return (
    <Link
      href={href}
      onClick={onClick}
      className={`inline-flex items-center gap-2.5 ${className}`}
      aria-label="RentNow"
    >
      {img}
    </Link>
  )
}
