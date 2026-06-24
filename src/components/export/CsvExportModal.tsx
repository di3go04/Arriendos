'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useToast } from '@/components/ui/Toast'
import { Download, FileSpreadsheet, X, Loader2, Filter, Columns } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

interface ColumnDef {
  key: string
  label: string
}

const COLUMNS_BY_TYPE: Record<string, ColumnDef[]> = {
  properties: [
    { key: 'title', label: 'Título' },
    { key: 'address', label: 'Dirección' },
    { key: 'city', label: 'Ciudad' },
    { key: 'type', label: 'Tipo' },
    { key: 'monthly_rent', label: 'Canon Mensual' },
    { key: 'status', label: 'Estado' },
    { key: 'bedrooms', label: 'Habitaciones' },
    { key: 'bathrooms', label: 'Baños' },
    { key: 'area_sqm', label: 'Área (m²)' },
    { key: 'deposit', label: 'Depósito' },
    { key: 'available_from', label: 'Disponible Desde' },
    { key: 'created_at', label: 'Creada' },
  ],
  tenants: [
    { key: 'full_name', label: 'Nombre Completo' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Teléfono' },
    { key: 'role', label: 'Rol' },
    { key: 'created_at', label: 'Registrado' },
  ],
  payments: [
    { key: 'amount', label: 'Monto' },
    { key: 'due_date', label: 'Fecha Vencimiento' },
    { key: 'paid', label: 'Pagado' },
    { key: 'paid_at', label: 'Fecha Pago' },
    { key: 'payment_method', label: 'Método' },
    { key: 'status', label: 'Estado' },
    { key: 'contract_id', label: 'Contrato' },
    { key: 'created_at', label: 'Creado' },
  ],
  contracts: [
    { key: 'contract_number', label: 'Número' },
    { key: 'status', label: 'Estado' },
    { key: 'monthly_rent', label: 'Canon' },
    { key: 'start_date', label: 'Inicio' },
    { key: 'end_date', label: 'Fin' },
    { key: 'created_at', label: 'Creado' },
  ],
}

interface CsvExportModalProps {
  open: boolean
  onClose: () => void
  type?: 'properties' | 'tenants' | 'payments' | 'contracts'
  defaultFilters?: Record<string, string>
}

export function CsvExportModal({ open, onClose, type = 'properties', defaultFilters }: CsvExportModalProps) {
  const { toast } = useToast()
  const [selectedColumns, setSelectedColumns] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    propertyId: '',
    status: '',
    ...defaultFilters,
  })

  const columns = COLUMNS_BY_TYPE[type] || COLUMNS_BY_TYPE.properties

  useEffect(() => {
    if (open) {
      setSelectedColumns(new Set(columns.map(c => c.key)))
      setProgress(0)
      setLoading(false)
    }
  }, [open, columns])

  const toggleColumn = (key: string) => {
    const next = new Set(selectedColumns)
    if (next.has(key)) {
      if (next.size > 1) next.delete(key)
    } else {
      next.add(key)
    }
    setSelectedColumns(next)
  }

  const selectAll = () => setSelectedColumns(new Set(columns.map(c => c.key)))
  const deselectAll = () => {
    if (columns.length > 0) {
      setSelectedColumns(new Set([columns[0].key]))
    }
  }

  const handleExport = async () => {
    if (selectedColumns.size === 0) {
      toast({ type: 'error', message: 'Selecciona al menos una columna' })
      return
    }

    setLoading(true)
    setProgress(10)

    try {
      const params = new URLSearchParams()
      params.set('type', type)
      params.set('columns', Array.from(selectedColumns).join(','))
      if (filters.dateFrom) params.set('dateFrom', filters.dateFrom)
      if (filters.dateTo) params.set('dateTo', filters.dateTo)
      if (filters.propertyId) params.set('propertyId', filters.propertyId)
      if (filters.status) params.set('status', filters.status)

      setProgress(30)

      const res = await fetch(`/api/export/csv?${params.toString()}`)
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Error al exportar')
      }

      setProgress(70)

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${type}_export_${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      setProgress(100)
      toast({ type: 'success', message: 'CSV descargado correctamente' })
      setTimeout(onClose, 800)
    } catch (err) {
      toast({ type: 'error', message: err instanceof Error ? err.message : 'Error al exportar CSV' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            onClick={e => e.stopPropagation()}
            className="bg-background border rounded-2xl shadow-xl w-full max-w-lg mx-4 max-h-[85vh] flex flex-col"
          >
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-primary" />
                <h2 className="font-bold text-lg">Exportar CSV</h2>
              </div>
              <button onClick={onClose} className="rounded-lg p-1 hover:bg-muted transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Filters toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                <Filter className="h-4 w-4" />
                {showFilters ? 'Ocultar filtros' : 'Mostrar filtros'}
              </button>

              <AnimatePresence>
                {showFilters && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">Fecha desde</label>
                        <input
                          type="date"
                          value={filters.dateFrom}
                          onChange={e => setFilters(f => ({ ...f, dateFrom: e.target.value }))}
                          className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">Fecha hasta</label>
                        <input
                          type="date"
                          value={filters.dateTo}
                          onChange={e => setFilters(f => ({ ...f, dateTo: e.target.value }))}
                          className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">Estado</label>
                        <select
                          value={filters.status}
                          onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
                          className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm"
                        >
                          <option value="">Todos</option>
                          <option value="disponible">Disponible</option>
                          <option value="ocupado">Ocupado</option>
                          <option value="mantenimiento">Mantenimiento</option>
                          <option value="activo">Activo</option>
                          <option value="pendiente_firma">Pendiente Firma</option>
                          <option value="finalizado">Finalizado</option>
                        </select>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Column selection */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Columns className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Columnas ({selectedColumns.size}/{columns.length})</span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={selectAll} className="text-xs text-primary hover:underline">Todo</button>
                    <button onClick={deselectAll} className="text-xs text-muted-foreground hover:underline">Ninguno</button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto rounded-lg border p-2">
                  {columns.map(col => (
                    <label
                      key={col.key}
                      className={cn(
                        'flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm cursor-pointer transition-colors',
                        selectedColumns.has(col.key)
                          ? 'bg-primary/10 text-primary'
                          : 'hover:bg-muted text-muted-foreground'
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={selectedColumns.has(col.key)}
                        onChange={() => toggleColumn(col.key)}
                        className="rounded border-muted-foreground text-primary focus:ring-primary"
                      />
                      {col.label}
                    </label>
                  ))}
                </div>
              </div>

              {/* Progress bar */}
              {loading && (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Exportando...</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <motion.div
                      className="h-full bg-primary rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="border-t p-4 flex justify-end gap-2">
              <Button variant="outline" onClick={onClose} disabled={loading}>
                Cancelar
              </Button>
              <Button onClick={handleExport} disabled={loading || selectedColumns.size === 0} loading={loading}>
                <Download className="h-4 w-4" />
                {loading ? 'Exportando...' : 'Descargar CSV'}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
