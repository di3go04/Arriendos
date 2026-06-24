'use client'

import { motion } from 'framer-motion'
import {
  HeroBackground,
  HeroBadge,
  HeroTitle,
  HeroSubtitle,
  HeroCTAs,
  HeroBenefits,
  HeroMockup,
} from './hero-parts'

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-brand-900 pt-20 lg:pt-28 pb-24 md:py-32">
      <HeroBackground />

      <div className="relative mx-auto max-w-7xl px-6 md:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 xl:gap-20 items-center">

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <HeroBadge />
            <HeroTitle />
            <HeroSubtitle />
            <HeroCTAs />
            <HeroBenefits />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
          >
            <HeroMockup />
          </motion.div>
        </div>
      </div>
    </section>
  )
}
