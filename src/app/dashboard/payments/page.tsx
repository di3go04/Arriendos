'use client'

import { useTranslations } from 'next-intl'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { CreditCard, Download, Filter, CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react'
import { usePayments, formatCurrency } from '@/hooks/usePayments'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

export default function PaymentsPage() {
  const t = useTranslations('payments_page')
  const tp = useTranslations('payments')
  const ta = useTranslations('actions')
  const { payments, isLoading } = usePayments()

  const formatDate = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), 'dd MMM yyyy', { locale: es })
    } catch {
      return dateStr
    }
  }

  const statusConfig = (status: string) => {
    switch (status) {
      case 'Paid':
        return { label: tp('status_paid'), cls: 'bg-success/10 text-success', icon: CheckCircle }
      case 'Pending':
        return { label: tp('status_pending'), cls: 'bg-amber-50 text-amber-700', icon: Clock }
      case 'Overdue':
        return { label: tp('status_overdue'), cls: 'bg-red-50 text-red-700', icon: XCircle }
      case 'Failed':
        return { label: tp('status_overdue'), cls: 'bg-red-50 text-red-700', icon: XCircle }
      default:
        return { label: status, cls: 'bg-muted text-muted-foreground', icon: Clock }
    }
  }

  const handleExport = () => {
    if (payments.length === 0) return
    const csv = [t('csv_header')]
    payments.forEach(p =>
      csv.push(`${p.tenant_name},${p.property_name},${formatCurrency(p.amount)},${formatDate(p.date)},${p.status},${p.invoice_url || '-'}`)
    )
    const blob = new Blob([csv.join('\n')], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = t('csv_filename'); a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{tp('title')}</h1>
          <p className="text-muted-foreground">{t('subtitle')}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-1.5"><Filter className="h-4 w-4" /> {ta('filter')}</Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={handleExport} disabled={payments.length === 0}>
            <Download className="h-4 w-4" /> {t('export')}
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : payments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-16 text-center">
            <CreditCard className="h-10 w-10 text-muted-foreground/40 mb-4" />
            <p className="font-medium text-foreground">{tp('no_payments')}</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="text-sm text-muted-foreground">
            Total de pagos: <span className="font-bold text-foreground">{payments.length}</span>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-muted-foreground text-xs uppercase tracking-wider">
                      <th className="text-left px-4 py-3 font-medium">{t('tenant')}</th>
                      <th className="text-left px-4 py-3 font-medium">{t('property')}</th>
                      <th className="text-right px-4 py-3 font-medium">{tp('amount')}</th>
                      <th className="text-left px-4 py-3 font-medium">{t('due_short')}</th>
                      <th className="text-left px-4 py-3 font-medium">{t('status')}</th>
                      <th className="text-left px-4 py-3 font-medium">{tp('receipt')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {payments.map(p => {
                      const cfg = statusConfig(p.status)
                      const Icon = cfg.icon
                      return (
                        <tr key={p.id} className="hover:bg-muted/50 transition-colors">
                          <td className="px-4 py-3 font-medium text-foreground">{p.tenant_name}</td>
                          <td className="px-4 py-3 text-muted-foreground">{p.property_name}</td>
                          <td className="px-4 py-3 text-right font-medium">{formatCurrency(p.amount)}</td>
                          <td className="px-4 py-3">{formatDate(p.date)}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${cfg.cls}`}>
                              <Icon className="h-3 w-3" />
                              {cfg.label}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {p.invoice_url ? (
                              <a href={p.invoice_url} target="_blank" rel="noopener noreferrer"
                                className="text-primary hover:underline text-xs font-medium">
                                {tp('receipt')}
                              </a>
                            ) : (
                              <span className="text-muted-foreground/50 text-xs">&mdash;</span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Conciliación banner */}
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CreditCard className="h-5 w-5 text-primary" />
            <div>
              <p className="font-medium text-foreground">{t('auto_reconciliation')}</p>
              <p className="text-sm text-muted-foreground">{t('reconciliation_desc')}</p>
            </div>
          </div>
          <Button size="sm">{t('connect_bank')}</Button>
        </CardContent>
      </Card>
    </div>
  )
}
