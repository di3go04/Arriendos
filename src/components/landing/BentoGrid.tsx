'use client'

import { motion } from 'framer-motion'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useTranslations } from 'next-intl'
import {
  BarChart3, Shield, Phone, Wallet, Sparkles, ArrowRight,
} from 'lucide-react'

const bentoKeys = [
  { icon: BarChart3, size: 'lg', color: 'from-blue-500 to-blue-600', key: 'dashboard' },
  { icon: Shield, size: 'sm', color: 'from-purple-500 to-purple-600', key: 'verification' },
  { icon: Phone, size: 'sm', color: 'from-green-500 to-green-600', key: 'collection' },
  { icon: Wallet, size: 'md', color: 'from-amber-500 to-amber-600', key: 'coliving' },
  { icon: Sparkles, size: 'md', color: 'from-red-500 to-red-600', key: 'ai' },
]

export function BentoGrid() {
  const t = useTranslations('bentoGrid')

  return (
    <section className="py-24 bg-background">
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

        <div className="grid grid-cols-1 md:grid-cols-4 gap-5 auto-rows-[200px]">
          {bentoKeys.map((item, i) => {
            const Icon = item.icon
            const span = item.size === 'lg' ? 'md:col-span-2 md:row-span-2' : item.size === 'md' ? 'md:col-span-2' : ''
            return (
              <motion.div
                key={item.key}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={span}
              >
                <Card hover className="h-full p-6 flex flex-col justify-between relative overflow-hidden">
                  <div className={`absolute top-0 right-0 w-32 h-32 rounded-bl-full opacity-10 bg-gradient-to-br ${item.color}`} />
                  <div>
                    <div className={`inline-flex rounded-lg bg-gradient-to-br ${item.color} p-2.5 text-white mb-3`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground">{t(`items.${item.key}.title`)}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{t(`items.${item.key}.description`)}</p>
                  </div>
                  <Button variant="ghost" size="sm" className="self-end gap-1 mt-4">
                    {t('explore')} <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Card>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
