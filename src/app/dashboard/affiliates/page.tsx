'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import {
  Users, DollarSign, Copy, TrendingUp, Gift,
  CheckCircle, BarChart3, Link, Loader2, RefreshCw, UserCheck, MessageCircle
} from 'lucide-react'
import { motion } from 'framer-motion'
import { useToast } from '@/components/ui/Toast'
import { useTranslations } from 'next-intl'

interface AffiliateData {
  affiliateCode: string
  referralLink: string
  stats: {
    clicks: number
    signups: number
    activeSubscriptions: number
    earningsPending: number
    earningsPaid: number
  }
  referrals?: Array<{
    id: string
    name: string
    email: string
    status: string
    commission: number
    date: string
  }>
}

export default function AffiliatesPage() {
  const { toast } = useToast()
  const t = useTranslations('AFFILIATES_PAGE')
  const [data, setData] = useState<AffiliateData | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/affiliates')
        if (!res.ok) { setData(null); return }
        const json = await res.json()
        const code = json.affiliateCode || `RENTNOW_${Math.random().toString(36).slice(2, 8).toUpperCase()}`
        setData({
          affiliateCode: code,
          referralLink: json.referralLink || `${window.location.origin}/register?ref=${code}`,
          stats: json.stats || { clicks: 0, signups: 0, activeSubscriptions: 0, earningsPending: 0, earningsPaid: 0 },
          referrals: json.referrals || [],
        })
      } catch {
        const code = `RENTNOW_${Math.random().toString(36).slice(2, 8).toUpperCase()}`
        setData({
          affiliateCode: code,
          referralLink: `${window.location.origin}/register?ref=${code}`,
          stats: { clicks: 0, signups: 0, activeSubscriptions: 0, earningsPending: 0, earningsPaid: 0 },
          referrals: [],
        })
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      toast({ type: 'success', message: t('toast_link_copied') })
      setTimeout(() => setCopied(false), 2000)
    } catch {
      const textarea = document.createElement('textarea')
      textarea.value = text
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setCopied(true)
      toast({ type: 'success', message: t('toast_link_copied') })
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleShareWhatsApp = () => {
    if (!data?.referralLink) return
    const message = encodeURIComponent(
      t('whatsapp_share_message', { link: data.referralLink })
    )
    window.open(`https://wa.me/?text=${message}`, '_blank')
  }

  const handleRefresh = () => {
    setLoading(true)
    fetch('/api/affiliates')
      .then(res => res.ok ? res.json() : null)
      .then(json => {
        if (!json) { setData(null); return }
        const code = json.affiliateCode || data?.affiliateCode || ''
        setData({
          affiliateCode: code,
          referralLink: json.referralLink || `${window.location.origin}/register?ref=${code}`,
          stats: json.stats || data?.stats || { clicks: 0, signups: 0, activeSubscriptions: 0, earningsPending: 0, earningsPaid: 0 },
          referrals: json.referrals || data?.referrals || [],
        })
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  const totalEarnings = (data?.stats?.earningsPaid || 0) + (data?.stats?.earningsPending || 0)
  const conversionRate = data?.stats?.clicks && data.stats.clicks > 0
    ? Math.round((data.stats.signups / data.stats.clicks) * 100)
    : 0

  const commissionTiers = [
    { level: 'bronze', labelKey: 'tier_bronze', referrals: '1-5', commission: '10%', color: 'from-amber-600 to-amber-700', min: 0 },
    { level: 'silver', labelKey: 'tier_silver', referrals: '6-15', commission: '15%', color: 'from-gray-400 to-gray-500', min: 6 },
    { level: 'gold', labelKey: 'tier_gold', referrals: '16-30', commission: '20%', color: 'from-yellow-400 to-yellow-500', min: 16 },
    { level: 'platinum', labelKey: 'tier_platinum', referrals: '31+', commission: '25%', color: 'from-purple-400 to-purple-500', min: 31 },
  ]

  const signups = data?.stats?.signups || 0
  const currentTier = [...commissionTiers].reverse().find(t => signups >= t.min) || commissionTiers[0]
  const nextTier = commissionTiers.find(t => signups < t.min)
  const progressToNext = nextTier ? Math.min(100, Math.round((signups / nextTier.min) * 100)) : 100

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">{t('loading')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('page_title')}</h1>
          <p className="text-muted-foreground">{t('page_subtitle')}</p>
        </div>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={handleRefresh}>
          <RefreshCw className="h-4 w-4" /> {t('refresh_button')}
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { icon: Users, label: t('stat_clicks'), value: data?.stats?.clicks?.toString() || '0', color: 'from-blue-500 to-blue-600' },
          { icon: UserCheck, label: t('stat_signups'), value: data?.stats?.signups?.toString() || '0', color: 'from-green-500 to-green-600' },
          { icon: CheckCircle, label: t('stat_active_subscriptions'), value: data?.stats?.activeSubscriptions?.toString() || '0', color: 'from-purple-500 to-purple-600' },
          { icon: DollarSign, label: t('stat_total_earnings'), value: `$${totalEarnings.toFixed(2)}`, color: 'from-amber-500 to-amber-600' },
          { icon: TrendingUp, label: t('stat_conversion_rate'), value: `${conversionRate}%`, color: 'from-emerald-500 to-emerald-600' },
        ].map((stat, i) => {
          const Icon = stat.icon
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card>
                <CardContent className="p-4">
                  <div className={`inline-flex rounded-lg bg-gradient-to-br ${stat.color} p-2 text-white mb-2`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <p className="text-xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <h3 className="font-semibold flex items-center gap-2">
              <Link className="h-5 w-5 text-primary" />
              {t('referral_link_title')}
            </h3>
          </CardHeader>
          <CardContent className="space-y-4">
            {data && (
              <>
                <div className="flex gap-2">
                  <Input value={data.referralLink} readOnly className="font-mono text-xs flex-1 select-all" />
                  <Button variant="outline" size="sm" onClick={() => handleCopy(data.referralLink)} className="gap-1.5 shrink-0">
                    {copied ? <CheckCircle className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
                    {copied ? t('copied') : t('copy')}
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button className="flex-1 gap-2" onClick={handleShareWhatsApp}>
                    <MessageCircle className="h-4 w-4" /> {t('share_whatsapp')}
                  </Button>
                </div>
                <div className="rounded-lg bg-muted p-3">
                  <p className="text-sm font-medium text-foreground">
                    {t('your_code')}: <span className="font-mono text-primary font-bold">{data.affiliateCode}</span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t('referral_description')}
                  </p>
                </div>
                {nextTier && (
                  <div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
                      <span>{t('current_tier')}: <strong>{t(currentTier.labelKey)}</strong> ({currentTier.commission})</span>
                      <span>{t('next_tier')}: {t(nextTier.labelKey)} ({nextTier.commission})</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progressToNext}%` }}
                        className="h-full rounded-full bg-gradient-to-r from-primary to-secondary"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {t('referrals_to_next_tier', { count: nextTier.min - signups, tier: t(nextTier.labelKey) })}
                    </p>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="font-semibold flex items-center gap-2">
              <Gift className="h-5 w-5 text-primary" />
              {t('commission_table_title')}
            </h3>
          </CardHeader>
          <CardContent className="space-y-3">
            {commissionTiers.map((tier, i) => (
              <motion.div
                key={tier.level}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`flex items-center justify-between rounded-lg border p-3 transition-colors ${
                  currentTier.level === tier.level ? 'border-primary bg-primary/5 ring-1 ring-primary' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`rounded-lg bg-gradient-to-br ${tier.color} px-2.5 py-1 text-xs font-bold text-white`}>
                    {t(tier.labelKey)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{t('tier_referrals', { range: tier.referrals })}</p>
                    <p className="text-xs text-muted-foreground">{t('commission_per_referral')}</p>
                  </div>
                </div>
                <span className="text-lg font-bold text-primary">{tier.commission}</span>
              </motion.div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <h3 className="font-semibold flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            {t('earnings_summary_title')}
          </h3>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="text-center p-4 rounded-lg bg-muted">
              <p className="text-3xl font-bold text-foreground">${(data?.stats?.earningsPaid || 0).toFixed(2)}</p>
              <p className="text-sm text-muted-foreground">{t('paid')}</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted">
              <p className="text-3xl font-bold text-amber-500">${(data?.stats?.earningsPending || 0).toFixed(2)}</p>
              <p className="text-sm text-muted-foreground">{t('pending')}</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted">
              <p className="text-3xl font-bold text-primary">${totalEarnings.toFixed(2)}</p>
              <p className="text-sm text-muted-foreground">{t('total_earned')}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h3 className="font-semibold flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            {t('my_referrals_title')}
          </h3>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-muted-foreground text-xs uppercase tracking-wider">
                  <th className="text-left px-4 py-3 font-medium">{t('table_header_name')}</th>
                  <th className="text-left px-4 py-3 font-medium">{t('table_header_email')}</th>
                  <th className="text-left px-4 py-3 font-medium">{t('table_header_status')}</th>
                  <th className="text-right px-4 py-3 font-medium">{t('table_header_commission')}</th>
                  <th className="text-right px-4 py-3 font-medium">{t('table_header_date')}</th>
                </tr>
              </thead>
              <tbody>
                {data?.referrals && data.referrals.length > 0 ? (
                  data.referrals.map(ref => (
                    <tr key={ref.id} className="border-b hover:bg-muted/50 transition-colors">
                      <td className="px-4 py-3 font-medium text-foreground">{ref.name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{ref.email}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          ref.status === 'active' ? 'bg-success/10 text-success' :
                          ref.status === 'pending' ? 'bg-amber-50 text-amber-700' :
                          'bg-muted text-muted-foreground'
                        }`}>{ref.status}</span>
                      </td>
                      <td className="px-4 py-3 text-right font-medium">${ref.commission?.toFixed(2) || '0.00'}</td>
                      <td className="px-4 py-3 text-right text-muted-foreground">{ref.date}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center">
                      <Users className="mx-auto h-10 w-10 text-muted-foreground/30 mb-3" />
                      <p className="text-muted-foreground font-medium">{t('empty_state_title')}</p>
                      <p className="text-sm text-muted-foreground/70 mt-1">{t('empty_state_description')}</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
