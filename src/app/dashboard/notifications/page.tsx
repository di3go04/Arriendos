'use client'

import { useNotifications, getTypeIcon, getTypeLabel, getNotificationLink } from '@/hooks/useNotifications'
import { Check, Bell, Loader2, Calendar, EyeOff, ArrowLeft, Filter } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'

const TYPE_FILTERS = ['all', 'unread', 'pago_proximo', 'pago_vencido', 'pago_validado', 'contrato_pendiente_firma', 'contrato_firmado', 'contrato_proximo_vencer', 'contrato_vencido', 'success', 'warning', 'danger', 'info'] as const
type FilterValue = (typeof TYPE_FILTERS)[number]

const FILTER_KEY_MAP: Record<string, string> = {
  all: 'all_filter',
  unread: 'unread_filter',
  pago_proximo: 'payment_soon',
  pago_vencido: 'payment_overdue',
  pago_validado: 'payment_validated',
  contrato_pendiente_firma: 'contract_signing',
  contrato_firmado: 'contract_signed',
  contrato_proximo_vencer: 'contract_expiring',
  contrato_vencido: 'contract_expired',
  success: 'type_success',
  warning: 'type_warning',
  danger: 'type_danger',
  info: 'type_info',
}

export default function NotificationsPage() {
  const router = useRouter()
  const t = useTranslations('notifications')
  const { notifications, loading, unreadCount, fetchNotifications, markAsRead, markAllAsRead } = useNotifications()
  const [filter, setFilter] = useState<FilterValue>('all')

  const filtered = notifications.filter(n => {
    if (filter === 'unread') return !n.read
    if (filter !== 'all') return n.type === filter
    return true
  })

  const handleClick = async (n: any) => {
    if (!n.read) await markAsRead(n.id)
    const link = getNotificationLink(n)
    if (link && link !== '#') router.push(link)
  }

  return (
    <div className="max-w-3xl mx-auto py-6 px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="p-2 rounded-lg hover:bg-muted text-muted-foreground transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-foreground">{t('title')}</h1>
              <p className="text-xs text-ink-muted mt-0.5">
                {unreadCount > 0
                  ? t('x_unread', { count: unreadCount })
                  : t('no_unread')}
              </p>
            </div>
          </div>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 transition-colors px-3 py-1.5 rounded-lg border border-primary/20 hover:bg-primary/5 cursor-pointer"
          >
            <Check className="w-3.5 h-3.5" />
            {t('mark_all_read_short')}
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-1.5 mb-4 overflow-x-auto pb-2 scrollbar-none">
        <Filter className="w-3.5 h-3.5 text-ink-muted shrink-0" />
        {TYPE_FILTERS.map(tKey => (
          <button
            key={tKey}
            onClick={() => setFilter(tKey)}
            className={cn(
              'text-[10px] font-semibold px-2.5 py-1 rounded-full border whitespace-nowrap transition-all cursor-pointer shrink-0',
              filter === tKey
                ? 'bg-primary/10 border-primary/30 text-primary'
                : 'bg-transparent border-border text-muted-foreground hover:text-foreground hover:border-muted-foreground/30'
            )}
          >
            {FILTER_KEY_MAP[tKey] ? t(FILTER_KEY_MAP[tKey]) : tKey}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="space-y-1">
        {loading && notifications.length === 0 ? (
          <div className="py-20 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center space-y-3">
            <div className="p-4 rounded-full bg-muted inline-flex text-muted-foreground">
              <Bell className="w-8 h-8" />
            </div>
            <p className="text-sm font-semibold text-foreground">{t('no_notifications')}</p>
            <p className="text-xs text-ink-muted max-w-[240px] mx-auto">
              {filter !== 'all' ? t('no_filter_match') : t('no_notifications_desc') + ' ' + t('we_will_notify')}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border rounded-xl border border-border overflow-hidden">
            {filtered.map(n => {
              const { icon: Icon, cls } = getTypeIcon(n.type)
              const isUnread = !n.read
              return (
                <div
                  key={n.id}
                  onClick={() => handleClick(n)}
                  className={cn(
                    'flex items-start gap-3 px-4 py-3.5 transition-all cursor-pointer group',
                    isUnread ? 'bg-primary/[0.02] border-l-2 border-l-primary' : 'border-l-2 border-l-transparent hover:bg-muted/30'
                  )}
                >
                  <div className={cn('p-2 rounded-lg shrink-0', cls)}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={cn('text-sm leading-snug', isUnread ? 'font-semibold text-foreground' : 'font-medium text-ink-tertiary')}>
                        {n.title}
                      </p>
                      {isUnread && <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5" />}
                    </div>
                    {n.message && (
                      <p className="text-xs text-ink-muted mt-0.5 leading-relaxed line-clamp-2">{n.message}</p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[10px] font-medium text-ink-muted flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {format(parseISO(n.created_at), "d 'de' MMMM 'de' yyyy, HH:mm", { locale: es })}
                      </span>
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded border border-border text-ink-tertiary">
                        {getTypeLabel(n.type)}
                      </span>
                      {isUnread && (
                        <button
                          onClick={(e) => { e.stopPropagation(); markAsRead(n.id) }}
                          className="text-[10px] font-semibold text-primary hover:underline flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer ml-auto"
                        >
                          <EyeOff className="w-3 h-3" /> {t('mark_read')}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {notifications.length > 0 && (
          <p className="text-[10px] text-ink-muted text-center pt-3">
            {t('total_count', { count: notifications.length })}
            {filtered.length !== notifications.length && ` · ${t('filtered_count', { count: filtered.length })}`}
          </p>
        )}
      </div>
    </div>
  )
}
