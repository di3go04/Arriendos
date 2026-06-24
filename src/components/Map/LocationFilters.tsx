'use client'

import { useMemo, useState, useRef, useEffect, useCallback } from 'react'
import { MapPin, RotateCcw, ChevronDown, Loader2 } from 'lucide-react'
import { useLocations } from '@/hooks/useLocations'

export interface FiltersState {
  country: string
  department: string
  city: string
}

interface LocationFiltersProps {
  filters: FiltersState
  onChange: (filters: FiltersState) => void
}

// ─── Custom scrollable dropdown ────────────────────────────────────
interface DropdownProps {
  label: string
  icon: typeof MapPin
  value: string
  options: { value: string; label: string }[]
  placeholder: string
  disabled?: boolean
  loading?: boolean
  onChange: (v: string) => void
}

function Dropdown({ label, icon: Icon, value, options, placeholder, disabled, loading, onChange }: DropdownProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = useCallback((v: string) => {
    onChange(v)
    setOpen(false)
  }, [onChange])

  const displayValue = value || placeholder

  return (
    <div className="relative group" ref={ref}>
      <label className="block text-[10px] font-semibold uppercase tracking-widest text-white/40 mb-1.5 ml-0.5">
        {label}
      </label>
      <div className="relative">
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/30 pointer-events-none transition-colors group-focus-within:text-amber-400 z-10" />
        <button
          type="button"
          disabled={disabled || loading}
          onClick={() => !disabled && !loading && setOpen((p) => !p)}
          className={`
            w-full min-w-[180px] max-w-[220px] appearance-none rounded-xl border bg-white/5 py-2.5 pl-9 pr-8
            text-sm backdrop-blur-xl transition-all duration-200 text-left
            border-white/[0.06] hover:border-white/20
            focus:outline-none focus:border-amber-400/60 focus:bg-white/[0.08]
            disabled:opacity-30 disabled:cursor-not-allowed
            ${value ? 'text-white/90' : 'text-white/40'}
          `}
        >
          {loading ? (
            <span className="flex items-center gap-2 text-white/40">
              <Loader2 className="h-3 w-3 animate-spin" />
              Cargando...
            </span>
          ) : (
            <span className="truncate block">{displayValue}</span>
          )}
        </button>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3 w-3 text-white/30 pointer-events-none" />

        {open && !loading && (
          <div className="absolute left-0 right-0 top-full mt-1 z-50 rounded-xl border border-white/[0.08] bg-brand-900/95 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.6)] overflow-hidden animate-fade-in">
            <div className="max-h-[260px] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
              <button
                type="button"
                onClick={() => handleSelect('')}
                className={`w-full px-3 py-2.5 text-left text-xs transition-colors hover:bg-white/[0.06] ${
                  !value ? 'text-amber-400 font-semibold' : 'text-white/50'
                }`}
              >
                {placeholder}
              </button>
              {options.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleSelect(opt.value)}
                  className={`w-full px-3 py-2.5 text-left text-xs transition-colors hover:bg-white/[0.06] border-t border-white/[0.03] ${
                    value === opt.value ? 'text-amber-400 font-semibold' : 'text-white/75'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Helpers ───────────────────────────────────────────────────────
function unique<T>(arr: T[]): T[] {
  return [...new Set(arr)]
}

// ─── Main component ────────────────────────────────────────────────
export function LocationFilters({ filters, onChange }: LocationFiltersProps) {
  const { locations, isLoading } = useLocations()

  // Listas derivadas en cascada desde el array plano
  const countries = useMemo(() => {
    return unique(locations.map((l) => l.country)).sort()
  }, [locations])

  const departments = useMemo(() => {
    if (!filters.country) return []
    const deptSet = new Set(
      locations
        .filter((l) => l.country === filters.country)
        .map((l) => l.department),
    )
    return [...deptSet].sort()
  }, [locations, filters.country])

  const cities = useMemo(() => {
    if (!filters.department) return []
    const citySet = new Set(
      locations
        .filter((l) => l.department === filters.department && l.country === filters.country)
        .map((l) => l.city),
    )
    return [...citySet].sort()
  }, [locations, filters.country, filters.department])

  // Reset departamento/ciudad cuando cambia el padre
  useEffect(() => {
    if (filters.department && !departments.includes(filters.department)) {
      onChange({ ...filters, department: '', city: '' })
    }
  }, [filters.country])

  useEffect(() => {
    if (filters.city && !cities.includes(filters.city)) {
      onChange({ ...filters, city: '' })
    }
  }, [filters.department])

  const hasSelection = filters.country || filters.department || filters.city

  return (
    <div className="relative w-full overflow-hidden rounded-2xl border border-white/[0.06] bg-brand-900/70 shadow-glass backdrop-blur-2xl">
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
      <div className="relative flex flex-wrap items-end gap-3 p-3 md:p-4">
        <Dropdown
          label="País"
          icon={MapPin}
          value={filters.country}
          placeholder={isLoading ? 'Cargando países...' : 'Todos los países'}
          loading={isLoading}
          options={countries.map((c) => ({ value: c, label: c }))}
          onChange={(v) => onChange({ country: v, department: '', city: '' })}
        />

        <Dropdown
          label="Departamento"
          icon={MapPin}
          value={filters.department}
          disabled={!filters.country}
          placeholder={filters.country ? 'Seleccionar departamento' : 'Selecciona un país primero'}
          options={departments.map((d) => ({ value: d, label: d }))}
          onChange={(v) => onChange({ ...filters, department: v, city: '' })}
        />

        <Dropdown
          label="Ciudad"
          icon={MapPin}
          value={filters.city}
          disabled={!filters.department}
          placeholder={filters.department ? 'Seleccionar ciudad' : 'Selecciona un departamento primero'}
          options={cities.map((c) => ({ value: c, label: c }))}
          onChange={(v) => onChange({ ...filters, city: v })}
        />

        {hasSelection && (
          <button
            type="button"
            onClick={() => onChange({ country: '', department: '', city: '' })}
            className="flex items-center gap-1.5 rounded-xl border border-white/[0.06] bg-white/5 px-3.5 py-2.5
                       text-[11px] font-medium text-white/50 backdrop-blur-xl transition-all duration-200
                       hover:border-white/20 hover:bg-white/[0.08] hover:text-white/80
                       active:scale-[0.97] self-end"
          >
            <RotateCcw className="h-3 w-3" />
            Limpiar
          </button>
        )}
      </div>
    </div>
  )
}
