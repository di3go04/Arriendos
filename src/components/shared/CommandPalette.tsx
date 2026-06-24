'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Command, FileText, Building2, DollarSign, Settings, Users, Home, ShieldCheck } from 'lucide-react';

interface CommandItem {
  id: string;
  label: string;
  href: string;
  icon: React.ElementType;
  keywords: string[];
}

const commands: CommandItem[] = [
  { id: '1', label: 'Dashboard', href: '/dashboard/landlord', icon: Home, keywords: ['inicio', 'panel', 'estadisticas'] },
  { id: '2', label: 'Propiedades', href: '/properties', icon: Building2, keywords: ['inmuebles', 'casas', 'apartamentos'] },
  { id: '3', label: 'Contratos', href: '/dashboard/leases', icon: FileText, keywords: ['arriendos', 'rentas', 'leasing'] },
  { id: '4', label: 'Pagos', href: '/dashboard/payments', icon: DollarSign, keywords: ['cobros', 'facturas', 'renta'] },
  { id: '5', label: 'Incidencias', href: '/dashboard/maintenance', icon: Settings, keywords: ['mantenimiento', 'reparaciones'] },
  { id: '6', label: 'Inquilinos', href: '/dashboard/tenants', icon: Users, keywords: ['inquilinos', 'arrendatarios'] },
  { id: '7', label: 'Status del Sistema', href: '/status', icon: ShieldCheck, keywords: ['estado', 'salud', 'monitoreo'] },
  { id: '8', label: 'Configuración', href: '/dashboard/settings', icon: Settings, keywords: ['ajustes', 'perfil', 'preferencias'] },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(o => !o);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setQuery('');
    setSelected(0);
  }, [open]);

  const filtered = query
    ? commands.filter(c =>
        c.label.toLowerCase().includes(query.toLowerCase()) ||
        c.keywords.some(k => k.includes(query.toLowerCase()))
      )
    : commands;

  const handleSelect = useCallback((item: CommandItem) => {
    setOpen(false);
    router.push(item.href);
  }, [router]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(s => Math.min(s + 1, filtered.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)); }
    if (e.key === 'Enter' && filtered[selected]) handleSelect(filtered[selected]);
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm flex items-start justify-center pt-[15vh]"
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-lg bg-card border border-border rounded-card shadow-modal overflow-hidden animate-scale-in"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <Search className="w-4 h-4 text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => { setQuery(e.target.value); setSelected(0); }}
            onKeyDown={handleKeyDown}
            placeholder="Buscar página o funcionalidad..."
            className="flex-1 bg-transparent border-none outline-none text-sm text-foreground placeholder:text-muted-foreground"
          />
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-muted text-[10px] font-mono text-muted-foreground border border-border">
            <Command className="w-2.5 h-2.5" />K
          </kbd>
        </div>

        <div className="max-h-72 overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <p className="text-center text-xs text-muted-foreground py-8">Sin resultados</p>
          ) : (
            filtered.map((item, i) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setSelected(i)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-left transition-colors cursor-pointer border-none ${
                    i === selected ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-muted'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="font-medium">{item.label}</span>
                  {i === selected && (
                    <kbd className="ml-auto text-[10px] font-mono text-muted-foreground opacity-60">↵</kbd>
                  )}
                </button>
              );
            })
          )}
        </div>

        <div className="flex items-center gap-4 px-4 py-2 border-t border-border text-[10px] text-muted-foreground">
          <span>↑↓ Navegar</span>
          <span>↵ Abrir</span>
          <span className="ml-auto"><kbd className="px-1 rounded bg-muted font-mono">esc</kbd> Cerrar</span>
        </div>
      </div>
    </div>
  );
}
