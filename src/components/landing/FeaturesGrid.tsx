'use client'

import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import {
  Building2, Shield, Users, FileText, CreditCard, Sparkles, Phone,
  Wallet, Map, BarChart3, Leaf, GraduationCap, Search,
  Handshake, BookOpen, TrendingUp, Download, Camera, Home
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

const featureIcons: LucideIcon[] = [
  Building2, Shield, Users, Phone, CreditCard, FileText,
  Wallet, Sparkles, TrendingUp, Search, Map, BarChart3,
  Leaf, Camera, Handshake, GraduationCap, Download, BookOpen, Home,
]

const featureKeys = [
  'saas', 'verification', 'kyc', 'voice_agents', 'reas', 'signature',
  'reconciliation', 'generative_ai', 'dynamic_pricing', 'ai_recommendation',
  'map_search', 'live_dashboard', 'esg', 'virtual_tours',
  'influencer', 'document_management', 'export', 'onboarding', 'analytics',
]

const badges: Record<string, string> = {
  'Core': 'bg-primary/10 text-primary',
  'Belvo': 'bg-blue-100 text-blue-700',
  'Onfido': 'bg-purple-100 text-purple-700',
  'Vapi.ai': 'bg-green-100 text-green-700',
  'REaaS': 'bg-gold-50 text-gold-600',
  'Legal': 'bg-red-100 text-red-700',
  'Auto': 'bg-teal-100 text-teal-700',
  'Gemini': 'bg-indigo-100 text-indigo-700',
  'IA': 'bg-red-100 text-red-700',
  'pgvector': 'bg-cyan-100 text-cyan-700',
  'Mapbox': 'bg-orange-100 text-orange-700',
  'Live': 'bg-gold-50 text-gold-600',
  'ESG': 'bg-lime-100 text-lime-700',
  '360°': 'bg-violet-100 text-violet-700',
  'Growth': 'bg-rose-100 text-rose-700',
  'AI': 'bg-red-100 text-red-700',
  'Finanzas': 'bg-gray-100 text-gray-700',
  'UX': 'bg-yellow-100 text-yellow-700',
  'Analytics': 'bg-indigo-100 text-indigo-700',
}

const featureBadges = [
  'Core', 'Belvo', 'Onfido', 'Vapi.ai', 'REaaS', 'Legal',
  'Auto', 'Gemini', 'IA', 'pgvector', 'Mapbox', 'Live',
  'ESG', '360°', 'Growth', 'AI', 'Finanzas', 'UX', 'Analytics',
]

export function FeaturesGrid() {
  const t = useTranslations('featuresGrid')

  return (
    <section className="py-24 bg-muted" id="features">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl font-bold text-foreground">
            {t('title')}
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            {t('subtitle')}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {featureKeys.map((key, index) => {
            const Icon = featureIcons[index]
            const badge = featureBadges[index]
            return (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className="group relative rounded-xl border bg-background p-5 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
              >
                <div className="mb-3 flex items-center justify-between">
                  <div className="rounded-lg bg-primary/10 p-2.5 text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                    <Icon className="h-5 w-5" />
                  </div>
                  {badge && (
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${badges[badge] || 'bg-gray-100 text-gray-600'}`}>
                      {badge}
                    </span>
                  )}
                </div>
                <h3 className="text-sm font-semibold text-foreground mb-1">{t(`features.${key}.title`)}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{t(`features.${key}.description`)}</p>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
