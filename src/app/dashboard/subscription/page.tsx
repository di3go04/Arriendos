'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/Toast';
import { useTranslations } from 'next-intl';
import { Check, CreditCard, Loader2, Shield, Zap, AlertTriangle, RefreshCw, FileText, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SubscriptionInfo {
  planId: string
  status: string
  trialEndsAt: string | null
  currentPeriodEnd: string | null
  planName?: string
}

interface Invoice {
  id: string
  amount: number
  status: string
  date: string
  url?: string
}

export default function SubscriptionPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const t = useTranslations('subscription');

  const PLANS = [
    {
      id: 'profesional',
      name: t('plan_profesional'),
      price: 29,
      currency: 'USD',
      interval: 'mes',
      features: [
        t('feature_properties_10'),
        t('feature_tenants_unlimited'),
        t('feature_ai_templates_unlimited'),
        t('feature_digital_signature'),
        t('feature_automatic_reminders'),
        t('feature_financial_reports'),
        t('feature_api_integration'),
        t('feature_priority_support'),
      ],
      priceId: process.env.NEXT_PUBLIC_STRIPE_PROFESIONAL_PRICE_ID || 'price_profesional_sandbox',
    },
    {
      id: 'empresa',
      name: t('plan_empresa'),
      price: 59,
      currency: 'USD',
      interval: 'mes',
      features: [
        t('feature_properties_unlimited'),
        t('feature_tenants_unlimited'),
        t('feature_everything_profesional'),
        t('feature_multi_user'),
        t('feature_support_24_7'),
        t('feature_white_label'),
        t('feature_sla_guaranteed'),
      ],
      priceId: process.env.NEXT_PUBLIC_STRIPE_EMPRESA_PRICE_ID || 'price_empresa_sandbox',
    },
  ];

  const [selectedPlan, setSelectedPlan] = useState<string>('profesional');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentSubscription, setCurrentSubscription] = useState<SubscriptionInfo | null>(null);
  const [subLoading, setSubLoading] = useState(true);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [showInvoices, setShowInvoices] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const fetchSubscription = async () => {
    setSubLoading(true)
    try {
      const res = await fetch('/api/subscriptions/current')
      if (res.ok) {
        const data = await res.json()
        setCurrentSubscription(data.subscription || null)
        setInvoices(data.invoices || [])
        if (data.subscription?.planId) {
          setSelectedPlan(data.subscription.planId)
        }
      }
    } catch {
      // No subscription yet
    } finally {
      setSubLoading(false)
    }
  }

  const handleSubscribe = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId: PLANS.find(p => p.id === selectedPlan)?.priceId,
          mode: 'subscription',
        }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error || t('error_checkout'));
      }
    } catch {
      setError(t('error_connection'));
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm(t('cancel_confirm'))) return
    setCancelling(true)
    try {
      const res = await fetch('/api/subscriptions/cancel', { method: 'POST' })
      if (res.ok) {
        toast({ type: 'success', message: t('cancel_success') })
        await fetchSubscription()
      } else {
        const data = await res.json()
        toast({ type: 'error', message: data.error || t('error_cancel') })
      }
    } catch {
      toast({ type: 'error', message: t('error_connection_short') })
    } finally {
      setCancelling(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      active: 'bg-success/10 text-success border-success/20',
      trialing: 'bg-primary/10 text-primary border-primary/20',
      cancelled: 'bg-error/10 text-error border-error/20',
      past_due: 'bg-warning/10 text-warning border-warning/20',
    }
    return styles[status] || 'bg-muted text-muted-foreground border-border'
  }

  const getPlanName = (planId: string) => {
    return PLANS.find(p => p.id === planId)?.name || planId
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('title')}</h1>
          <p className="text-muted-foreground">{t('subtitle')}</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchSubscription} disabled={subLoading}>
          <RefreshCw className={`h-4 w-4 ${subLoading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Current subscription */}
      {subLoading ? (
        <div className="h-20 rounded-xl bg-muted animate-pulse" />
      ) : currentSubscription ? (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-primary/20 bg-primary/5 p-4"
        >
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <Zap className="h-6 w-6 text-primary" />
              <div>
                <p className="font-semibold text-foreground">
                  {t('plan_label', { name: getPlanName(currentSubscription.planId) })}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`text-xs rounded-full border px-2 py-0.5 font-medium ${getStatusBadge(currentSubscription.status)}`}>
                    {currentSubscription.status === 'active' ? t('status_active') :
                     currentSubscription.status === 'trialing' ? t('status_trialing') :
                     currentSubscription.status === 'cancelled' ? t('status_cancelled') :
                     currentSubscription.status}
                  </span>
                  {currentSubscription.currentPeriodEnd && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                          {t('next_billing', { date: new Date(currentSubscription.currentPeriodEnd).toLocaleDateString() })}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              {currentSubscription.status !== 'cancelled' && (
                <Button variant="outline" size="sm" onClick={handleCancel} loading={cancelling}>
                  {t('cancel_subscription')}
                </Button>
              )}
            </div>
          </div>
        </motion.div>
      ) : null}

      {/* Sandbox badge */}
      <div className="rounded-xl border-2 border-amber-400/30 bg-amber-50 dark:bg-amber-900/10 p-4 flex items-center gap-3">
        <Shield className="w-5 h-5 text-amber-600 shrink-0" />
        <div className="text-sm">
          <span className="font-bold text-amber-800 dark:text-amber-300">{t('sandbox_title')}</span>
          <p className="text-amber-700 dark:text-amber-400/80 text-xs mt-0.5">
            {t('sandbox_desc')}
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 dark:bg-red-900/10 p-3 flex items-center gap-2 text-sm text-red-700 dark:text-red-400">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {PLANS.map((plan) => {
          const isSelected = selectedPlan === plan.id;
          const isCurrent = currentSubscription?.planId === plan.id;
          return (
            <button
              key={plan.id}
              type="button"
              onClick={() => setSelectedPlan(plan.id)}
              className={`relative text-left rounded-2xl border-2 p-6 transition-all cursor-pointer ${
                isSelected
                  ? 'border-primary bg-primary/5 shadow-md'
                  : 'border-border bg-card hover:border-primary/50'
              } ${isCurrent ? 'ring-2 ring-primary/30' : ''}`}
            >
              {isSelected && (
                <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                  <Check className="w-3.5 h-3.5 text-white" />
                </div>
              )}
              {isCurrent && (
                <div className="absolute top-3 left-3 rounded-full bg-success/10 text-success text-[10px] font-bold px-2 py-0.5">
                  {t('current_badge')}
                </div>
              )}

              <h3 className="text-lg font-bold text-foreground">{plan.name}</h3>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-3xl font-black text-foreground">${plan.price}</span>
                <span className="text-sm text-muted-foreground">/{t('per_month')}</span>
              </div>

              <ul className="mt-4 space-y-2">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <Check className="w-4 h-4 text-success shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
            </button>
          );
        })}
      </div>

      {/* Subscribe/Cancel action */}
      {(!currentSubscription || currentSubscription.planId !== selectedPlan) && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <CreditCard className="w-5 h-5 text-primary shrink-0" />
              <div>
                <p className="font-semibold text-foreground">
                  {PLANS.find(p => p.id === selectedPlan)?.name} — ${PLANS.find(p => p.id === selectedPlan)?.price}{t('per_month')}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t('secure_payment')}
                </p>
              </div>
            </div>
            <Button
              size="lg"
              onClick={handleSubscribe}
              disabled={loading}
              className="gap-2 min-w-[180px]"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> {t('processing')}</>
              ) : currentSubscription ? (
                <><Zap className="w-4 h-4" /> {t('change_plan')}</>
              ) : (
                <><Zap className="w-4 h-4" /> {t('subscribe_now')}</>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Invoice history */}
      {invoices.length > 0 && (
        <div>
          <button
            onClick={() => setShowInvoices(!showInvoices)}
            className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <FileText className="h-4 w-4" />
            {t('invoice_history', { count: invoices.length })}
          </button>
          <AnimatePresence>
            {showInvoices && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden mt-2"
              >
                <Card>
                  <CardContent className="p-0">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-3 font-medium text-muted-foreground">{t('date')}</th>
                          <th className="text-left p-3 font-medium text-muted-foreground">{t('amount')}</th>
                          <th className="text-left p-3 font-medium text-muted-foreground">{t('status')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {invoices.map(inv => (
                          <tr key={inv.id} className="border-b last:border-0">
                            <td className="p-3">{new Date(inv.date).toLocaleDateString()}</td>
                            <td className="p-3">${(inv.amount / 100).toFixed(2)}</td>
                            <td className="p-3">
                              <span className={`text-xs rounded-full px-2 py-0.5 font-medium ${
                                inv.status === 'paid' ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'
                              }`}>
                                {inv.status === 'paid' ? t('paid') : inv.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      <p className="text-xs text-muted-foreground text-center">
        {t('sandbox_footer')}
      </p>
    </div>
  );
}
