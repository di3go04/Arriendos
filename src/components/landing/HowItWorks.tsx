'use client'

import { motion, type Variants } from 'framer-motion'
import { UserPlus, Building2, BotMessageSquare, BarChart3 } from 'lucide-react'

const STEPS = [
  {
    number: '01',
    icon: UserPlus,
    title: 'Crea tu cuenta',
    description:
      'Regístrate gratis en minutos. Configura tu perfil de arrendador y tendrás acceso inmediato a todas las herramientas.',
    glow: 'rgba(251,191,36,0.15)',
  },
  {
    number: '02',
    icon: Building2,
    title: 'Publica tus propiedades',
    description:
      'Agrega tus inmuebles con fotos, contratos y datos de inquilinos. Importa desde Excel o crea desde cero.',
    glow: 'rgba(59,130,246,0.15)',
  },
  {
    number: '03',
    icon: BotMessageSquare,
    title: 'Automatiza cobros y contratos',
    description:
      'Genera contratos con IA, programa pagos automáticos y recibe notificaciones de vencimientos sin hacer nada manual.',
    glow: 'rgba(16,185,129,0.15)',
  },
  {
    number: '04',
    icon: BarChart3,
    title: 'Analiza tus métricas',
    description:
      'Panel en tiempo real con ingresos, ocupación, morosidad y reportes exportables. Toma decisiones con datos reales.',
    glow: 'rgba(139,92,246,0.15)',
  },
]

const containerVariants: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.12 },
  },
}

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut' } },
}

export function HowItWorks() {
  return (
    <section
      id="como-funciona"
      className="relative overflow-hidden bg-brand-900 py-24 md:py-32"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 70% 50% at 50% -10%, rgba(240,185,11,0.08) 0%, transparent 70%), radial-gradient(ellipse 40% 40% at 80% 80%, rgba(59,130,246,0.04) 0%, transparent 60%)',
        }}
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="text-sm font-semibold uppercase tracking-[0.15em] text-gold-400"
          >
            Flujo de trabajo
          </motion.p>

          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45, delay: 0.08 }}
            className="mt-3 text-4xl font-extrabold tracking-tight text-white sm:text-5xl"
          >
            Gestiona tus propiedades{' '}
            <span className="bg-gradient-to-r from-amber-300 to-amber-500 bg-clip-text text-transparent">
              en 4 pasos
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.16 }}
            className="mt-4 text-lg leading-relaxed text-white/60"
          >
            Sin curva de aprendizaje. Sin Excel. Sin papeles.
            Empieza a operar de forma profesional desde el primer día.
          </motion.p>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
        >
          {STEPS.map(({ number, icon: Icon, title, description, glow }) => (
            <motion.div
              key={number}
              variants={cardVariants}
              className="group relative flex flex-col rounded-2xl border border-white/[0.06] bg-white/[0.03] p-6 backdrop-blur-[6px] transition-all duration-500 hover:-translate-y-[5px] hover:shadow-2xl"
              style={{ boxShadow: `0 0 40px ${glow}` }}
            >
              <div
                aria-hidden
                className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r opacity-60 transition-opacity duration-500 group-hover:opacity-100"
                style={{
                  background: `linear-gradient(90deg, rgba(255,255,255,0.05), ${glow.replace('0.15', '0.6')}, rgba(255,255,255,0.05))`,
                }}
              />

              <span
                className="absolute -right-3 -top-3 select-none text-7xl font-black leading-none bg-gradient-to-br bg-clip-text text-transparent opacity-[0.07]"
                style={{
                  backgroundImage: `linear-gradient(135deg, ${glow.replace('0.15', '0.4')}, transparent 70%)`,
                  WebkitBackgroundClip: 'text',
                }}
              >
                {number}
              </span>

              <div
                className="relative mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl transition-transform duration-500 group-hover:scale-110"
                style={{
                  background: `${glow.replace('0.15', '0.12')}`,
                  border: `1px solid ${glow.replace('0.15', '0.25')}`,
                }}
              >
                <Icon className="h-5 w-5" style={{ color: glow.replace('0.15', '1') }} strokeWidth={2} />
              </div>

              <span
                className="relative mb-3 inline-flex w-fit items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em]"
                style={{
                  background: `${glow.replace('0.15', '0.12')}`,
                  color: glow.replace('0.15', '0.9'),
                }}
              >
                Paso {number}
              </span>

              <h3 className="relative text-base font-bold text-white">{title}</h3>
              <p className="relative mt-2 text-sm leading-relaxed text-white/55">{description}</p>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="mt-16 text-center"
        >
          <a
            href="/register"
            className="relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-gold-400 px-8 py-4 text-sm font-bold text-brand-900 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-amber-400/30 group"
          >
            <span
              aria-hidden
              className="absolute inset-0 animate-pulse rounded-full opacity-0 transition-opacity duration-1000 group-hover:opacity-100"
              style={{
                boxShadow: 'inset 0 0 18px rgba(251,191,36,0.5), 0 0 18px rgba(251,191,36,0.3)',
              }}
            />
            <span
              aria-hidden
              className="absolute inset-0 -translate-x-full animate-[shimmer_3s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent"
            />
            <span className="relative z-10">Empezar gratis</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="relative z-10 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
            </svg>
          </a>
        </motion.div>
      </div>

      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </section>
  )
}
