'use client'

import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'
import {
  AlertTriangle, Ban, Bell, CheckCircle2, Clock, DollarSign,
  FileSignature, Info, ShieldAlert, type LucideIcon,
} from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

export interface AppNotification {
  id: string
  user_id: string
  title: string | null
  message: string | null
  type: string | null
  read: boolean
  contract_id: string | null
  action_url?: string | null
  created_at: string
}

export function getTypeIcon(type: string | null): { icon: LucideIcon; cls: string } {
  switch (type) {
    case 'success': return { icon: CheckCircle2, cls: 'text-success bg-success/10' }
    case 'warning': return { icon: AlertTriangle, cls: 'text-warning bg-warning/10' }
    case 'danger': return { icon: ShieldAlert, cls: 'text-destructive bg-destructive/10' }
    case 'info': return { icon: Info, cls: 'text-accent bg-accent/10' }
    case 'pago_proximo': return { icon: Clock, cls: 'text-warning bg-warning/10' }
    case 'pago_vencido': return { icon: AlertTriangle, cls: 'text-destructive bg-destructive/10' }
    case 'pago_validado': return { icon: CheckCircle2, cls: 'text-success bg-success/10' }
    case 'pago_registrado': return { icon: DollarSign, cls: 'text-accent bg-accent/10' }
    case 'contrato_pendiente_firma': return { icon: FileSignature, cls: 'text-accent bg-accent/10' }
    case 'contrato_firmado': return { icon: CheckCircle2, cls: 'text-success bg-success/10' }
    case 'contrato_proximo_vencer': return { icon: Clock, cls: 'text-warning bg-warning/10' }
    case 'contrato_vencido': return { icon: Ban, cls: 'text-destructive bg-destructive/10' }
    default: return { icon: Bell, cls: 'text-muted-foreground bg-muted' }
  }
}

export function getTypeLabel(type: string | null): string {
  const labels: Record<string, string> = {
    info: 'Información', warning: 'Advertencia', success: 'Éxito', danger: 'Alerta',
    pago_proximo: 'Pago Próximo', pago_vencido: 'Pago Vencido', pago_validado: 'Pago Validado',
    pago_registrado: 'Pago Registrado',
    contrato_pendiente_firma: 'Firma Pendiente', contrato_firmado: 'Contrato Firmado',
    contrato_proximo_vencer: 'Contrato por Vencer', contrato_vencido: 'Contrato Vencido',
  }
  return labels[type || ''] || 'Notificación'
}

export function getNotificationLink(n: AppNotification): string {
  const type = n.type || ''
  if (type.startsWith('contrato_pendiente_firma')) return `/contracts/${n.contract_id}/sign`
  if (type === 'contrato_firmado' || type === 'contrato_proximo_vencer' || type === 'contrato_vencido') return `/contracts/${n.contract_id}/documents`
  if (type.startsWith('pago_')) return '/dashboard/payments'
  return '#'
}

export function useNotifications() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [loading, setLoading] = useState(true)

  const unreadCount = notifications.filter(n => !n.read).length

  const fetchNotifications = useCallback(async () => {
    if (!user) { setNotifications([]); setLoading(false); return }
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50)
      if (error) throw error
      setNotifications(data || [])
    } catch (err) {
      console.error('Error fetching notifications:', err)
    } finally {
      setLoading(false)
    }
  }, [user])

  const markAsRead = async (id: string) => {
    try {
      await supabase.from('notifications').update({ read: true }).eq('id', id)
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
    } catch (err) {
      console.error('Error marking notification as read:', err)
    }
  }

  const markAllAsRead = async () => {
    const unreadIds = notifications.filter(n => !n.read).map(n => n.id)
    if (unreadIds.length === 0) return
    try {
      await supabase.from('notifications').update({ read: true }).in('id', unreadIds)
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    } catch (err) {
      console.error('Error marking all as read:', err)
    }
  }

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  return { notifications, loading, unreadCount, fetchNotifications, markAsRead, markAllAsRead }
}
