'use client'

import { Hero, FeaturesGrid, BentoGrid, HowItWorks, PricingSection, ImpactSection } from '@/components/landing'
import LanguageSelector from '@/components/LanguageSelector'
import { Logo } from '@/components/Logo'
import { useLocale, useTranslations } from 'next-intl'
import { Building2, CheckCircle, Loader2, Menu, Send, X } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { useToast } from '@/components/ui/Toast'

export default function LocaleHomePage() {
  const t = useTranslations()
  const locale = useLocale()
  const { toast } = useToast()
  const [menuOpen, setMenuOpen] = useState(false)
  const [formData, setFormData] = useState({ name: '', email: '', message: '' })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [formStatus, setFormStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle')

  function l(path: string) {
    return path.startsWith('/') ? `/${locale}${path}` : path
  }

  function validateForm(): boolean {
    const errors: Record<string, string> = {}
    if (!formData.name.trim()) {
      errors.name = t('contact.required_field')
    }
    
    if (!formData.email.trim()) {
      errors.email = t('contact.required_field')
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = t('contact.invalid_email')
    }
    
    if (!formData.message.trim()) {
      errors.message = t('contact.required_field')
    } else if (formData.message.trim().length < 10) {
      errors.message = t('contact.message_min_length')
    }
    
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validateForm()) return
    setFormStatus('sending')
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      if (!res.ok) throw new Error('Failed')
      setFormStatus('success')
      toast({ type: 'success', message: t('contact.success_message') })
    } catch {
      setFormStatus('error')
      toast({ type: 'error', message: t('contact.error_message') })
    }
  }

  return (
    <main className="min-h-screen bg-brand-900">
      <nav className="sticky top-0 z-50 border-b border-white/5 bg-brand-900/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <Logo href={l('/')} theme="dark" />

          <div className="hidden md:flex items-center gap-8 text-sm">
            <Link href={l('/')} className="font-medium text-white/80 hover:text-white transition-colors">{t('nav.home')}</Link>
            <Link href="#features" className="font-medium text-white/80 hover:text-white transition-colors">{t('nav.features')}</Link>
            <Link href="#precios" className="font-medium text-white/80 hover:text-white transition-colors">{t('nav.pricing')}</Link>
            <Link href="#contacto" className="font-medium text-white/80 hover:text-white transition-colors">{t('nav.contact')}</Link>
            <LanguageSelector />
            <Link href="/login-direct" className="px-5 py-2 text-sm font-semibold rounded-pill border border-white/20 text-white/80 hover:bg-white/5 transition-all duration-300">{t('nav.login')}</Link>
            <Link href="/register" className="px-5 py-2.5 text-sm font-semibold rounded-pill bg-gold-400 hover:bg-gold-500 text-brand-900 transition-all duration-300 hover:shadow-lg hover:shadow-gold-400/30">{t('nav.signup')}</Link>
          </div>

          <button className="md:hidden text-white/70 hover:text-white" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {menuOpen && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="border-t border-white/5 bg-brand-850 md:hidden">
            <div className="flex flex-col gap-2 p-4">
              <Link href={l('/')} className="rounded-lg px-3 py-2 text-white/80 hover:text-white hover:bg-white/5" onClick={() => setMenuOpen(false)}>{t('nav.home')}</Link>
              <Link href="#features" className="rounded-lg px-3 py-2 text-white/80 hover:text-white hover:bg-white/5" onClick={() => setMenuOpen(false)}>{t('nav.features')}</Link>
              <Link href="#precios" className="rounded-lg px-3 py-2 text-white/80 hover:text-white hover:bg-white/5" onClick={() => setMenuOpen(false)}>{t('nav.pricing')}</Link>
              <Link href="#contacto" className="rounded-lg px-3 py-2 text-white/80 hover:text-white hover:bg-white/5" onClick={() => setMenuOpen(false)}>{t('nav.contact')}</Link>
              <div className="px-3 py-2">
                <LanguageSelector />
              </div>
              <Link href="/login-direct" className="rounded-lg px-3 py-2 text-white/80 hover:text-white hover:bg-white/5" onClick={() => setMenuOpen(false)}>{t('nav.login')}</Link>
              <Link href="/register" className="mt-2 block w-full text-center px-5 py-2.5 text-sm font-semibold rounded-pill bg-gold-400 hover:bg-gold-500 text-brand-900 transition-all duration-300" onClick={() => setMenuOpen(false)}>{t('nav.signup')}</Link>
            </div>
          </motion.div>
        )}
      </nav>

      <Hero />
      <FeaturesGrid />
      <BentoGrid />
      <HowItWorks />
      <ImpactSection />
      <PricingSection />

      <section className="py-24 md:py-32 bg-brand-800">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight">
            {t('home.readyTitle')}
          </h2>
          <p className="mt-4 text-lg text-white/70">
            {t('home.readyDescription')}
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register" className="px-8 py-4 text-lg font-semibold rounded-pill bg-gold-400 hover:bg-gold-500 text-brand-900 transition-all duration-300 hover:shadow-lg hover:shadow-gold-400/30 hover:scale-105">{t('home.startNow')}</Link>
            <Link href="/demo" className="px-8 py-4 text-lg font-semibold rounded-pill border-2 border-white/30 text-white/90 hover:bg-white/5 transition-all duration-300 hover:shadow-lg hover:scale-105">{t('home.requestDemo')}</Link>
          </div>
        </div>
      </section>

      <section id="contacto" className="py-24 md:py-32 px-6 md:px-10 bg-brand-900">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-4">{t('contact.title')}</h2>
            <p className="text-lg text-white/60 max-w-xl mx-auto">{t('home.contactDescription')}</p>
          </div>

          {formStatus === 'success' ? (
            <div className="text-center animate-fade-in">
              <div className="w-20 h-20 rounded-full bg-gold-400/20 flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-gold-400" />
              </div>
              <h3 className="text-3xl font-extrabold text-white mb-3">{t('contact.success_message')}</h3>
              <p className="text-white/60 text-lg">{t('home.contactSuccessDescription')}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-white/80 mb-2">{t('contact.name_label')}</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder={t('home.contactNamePlaceholder')}
                  className={`w-full bg-transparent border-b py-3 text-white placeholder-white/30 outline-none transition-colors duration-300 text-sm ${formErrors.name ? 'border-red-400' : 'border-white/20 focus:border-gold-400'}`}
                />
                {formErrors.name && <p className="text-xs text-red-400 mt-1">{formErrors.name}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-white/80 mb-2">{t('contact.email_label')}</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder={t('home.contactEmailPlaceholder')}
                  className={`w-full bg-transparent border-b py-3 text-white placeholder-white/30 outline-none transition-colors duration-300 text-sm ${formErrors.email ? 'border-red-400' : 'border-white/20 focus:border-gold-400'}`}
                />
                {formErrors.email && <p className="text-xs text-red-400 mt-1">{formErrors.email}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-white/80 mb-2">{t('contact.message_label')}</label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder={t('home.contactMessagePlaceholder')}
                  rows={4}
                  className={`w-full bg-transparent border-b py-3 text-white placeholder-white/30 outline-none transition-colors duration-300 text-sm resize-none ${formErrors.message ? 'border-red-400' : 'border-white/20 focus:border-gold-400'}`}
                />
                {formErrors.message && <p className="text-xs text-red-400 mt-1">{formErrors.message}</p>}
              </div>
              <button
                type="submit"
                disabled={formStatus === 'sending'}
                className="w-full py-4 text-base font-semibold rounded-pill bg-gold-400 hover:bg-gold-500 text-brand-900 transition-all duration-300 hover:shadow-lg hover:shadow-gold-400/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {formStatus === 'sending' ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> {t('auth.forgot_sending')}</>
                ) : (
                  <><Send className="w-5 h-5" /> {t('contact.submit_button')}</>
                )}
              </button>
              {formStatus === 'error' && (
                <p className="text-center text-sm text-red-400">{t('contact.error_message')}</p>
              )}
            </form>
          )}
        </div>
      </section>

      <footer className="border-t border-white/5 bg-brand-900 py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <Logo theme="dark" />
              <p className="text-sm text-white/40">{t('home.footerDescription')}</p>
            </div>
            <div>
              <h4 className="font-semibold mb-3 text-sm text-white/80">{t('home.footerProduct')}</h4>
              <ul className="space-y-2 text-sm text-white/40">
                <li><Link href="#features" className="hover:text-white transition-colors">{t('home.footerFeatures')}</Link></li>
                <li><Link href="#precios" className="hover:text-white transition-colors">{t('home.footerPricing')}</Link></li>
                <li><Link href="/developers" className="hover:text-white transition-colors">{t('home.footerApi')}</Link></li>
                <li><Link href="/demo" className="hover:text-white transition-colors">{t('home.footerDemo')}</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3 text-sm text-white/80">{t('home.footerCompany')}</h4>
              <ul className="space-y-2 text-sm text-white/40">
                <li><Link href="/blog" className="hover:text-white transition-colors">{t('home.footerBlog')}</Link></li>
                <li><Link href="#contacto" className="hover:text-white transition-colors">{t('home.footerContact')}</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3 text-sm text-white/80">{t('home.footerLegal')}</h4>
              <ul className="space-y-2 text-sm text-white/40">
                <li><Link href="/privacidad" className="hover:text-white transition-colors">{t('home.footerPrivacy')}</Link></li>
                <li><Link href="/terminos" className="hover:text-white transition-colors">{t('home.footerTerms')}</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-white/5 text-center text-sm text-white/40">
            &copy; {new Date().getFullYear()} RentNow. {t('home.footerRights')}
          </div>
        </div>
      </footer>
    </main>
  )
}
