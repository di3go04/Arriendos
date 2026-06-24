'use client'

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'

function useInViewOnce(ref: React.RefObject<HTMLElement | null>) {
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) { setInView(true); observer.unobserve(el) } }, { threshold: 0.15 })
    observer.observe(el)
    return () => observer.disconnect()
  }, [ref])
  return inView
}

const cards = [
  { key: 'efficiency', accent: 'gold' as const, target: 94, prefix: '+', suffix: '' },
  { key: 'availability', accent: 'blue' as const, target: 0, prefix: '', suffix: '' },
  { key: 'saved', accent: 'gold' as const, target: 85, prefix: '', suffix: ' h' },
]

function ImpactCard({ accent, index, inView, target, prefix, suffix, label, description }: {
  accent: 'gold' | 'blue'; index: number; inView: boolean; target: number; prefix: string; suffix: string; label: string; description: string
}) {
  const isGold = accent === 'gold'
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!inView || target === 0) return
    let current = 0
    const step = Math.ceil(target / 60)
    function tick() {
      current += step
      if (current > target) current = target
      setCount(current)
      if (current < target) requestAnimationFrame(tick)
    }
    tick()
  }, [inView, target])

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: index * 0.15, ease: 'easeOut' }}
      className={`group relative bg-brand-800 border border-white/5 rounded-2xl p-8 md:p-10 transition-all duration-300 hover:border-gold-400/30 hover:shadow-lg hover:shadow-gold-400/5 hover:-translate-y-1 ${index === 1 ? 'md:translate-y-6' : ''}`}
    >
      <div className={`w-14 h-14 rounded-xl ${isGold ? 'bg-gold-400/10 text-gold-400' : 'bg-blue-500/10 text-blue-400'} flex items-center justify-center mb-6`}>
        {index === 0 && <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
        {index === 1 && <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        {index === 2 && <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>}
      </div>
      <span className="text-5xl md:text-6xl font-black text-white block mb-2">{target > 0 ? prefix + count + suffix : '24/7'}</span>
      <span className={`text-lg font-semibold ${isGold ? 'text-gold-400' : 'text-blue-400'} block mb-3`}>{label}</span>
      <p className="text-white/60 leading-relaxed text-sm md:text-base">{description}</p>
    </motion.div>
  )
}

export function ImpactSection() {
  const t = useTranslations('impact')
  const sectionRef = useRef<HTMLDivElement>(null)
  const inView = useInViewOnce(sectionRef)

  return (
    <section ref={sectionRef} id="impact-section" className="relative py-24 md:py-32 bg-brand-850">
      <div className="mx-auto max-w-7xl px-6 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center max-w-3xl mx-auto mb-16 md:mb-20"
        >
          <h2 className="font-extrabold text-4xl md:text-5xl tracking-tight text-white mb-4">{t('title')}</h2>
          <p className="text-lg text-white/60 max-w-xl mx-auto">{t('subtitle')}</p>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {cards.map((card, i) => (
            <ImpactCard
              key={card.key}
              accent={card.accent}
              index={i}
              inView={inView}
              target={card.target}
              prefix={card.prefix}
              suffix={card.suffix}
              label={t(`cards.${card.key}.label`)}
              description={t(`cards.${card.key}.description`)}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
