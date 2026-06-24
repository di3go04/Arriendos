'use client'

import { Hero, FeaturesGrid, BentoGrid, PricingSection, ImpactSection } from '@/components/landing'
import LanguageSelector from '@/components/LanguageSelector'
import { ThemeToggle } from '@/components/ThemeToggle'
import { useTranslations } from 'next-intl'
import { Logo } from '@/components/Logo'
import { Building2, Menu, X } from 'lucide-react'
import Link from 'next/link'
import { useState, useRef } from 'react'
import { motion } from 'framer-motion'

export default function HomePage() {
  const t = useTranslations()
  const [menuOpen, setMenuOpen] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)
  const successRef = useRef<HTMLDivElement>(null)

  function shake(el: HTMLElement) {
    el.classList.add('shake')
    setTimeout(() => el.classList.remove('shake'), 400)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const form = formRef.current
    if (!form) return
    const name = form.querySelector('#field_name') as HTMLInputElement
    const email = form.querySelector('#field_email') as HTMLInputElement
    const msg = form.querySelector('#field_msg') as HTMLTextAreaElement
    const errName = form.querySelector('#err_name') as HTMLDivElement
    const errEmail = form.querySelector('#err_email') as HTMLDivElement
    const errMsg = form.querySelector('#err_msg') as HTMLDivElement

    let valid = true
    errName.classList.add('hidden'); errEmail.classList.add('hidden'); errMsg.classList.add('hidden')
    name.style.borderColor = ''; email.style.borderColor = ''; msg.style.borderColor = ''

    if (!name.value.trim()) {
      errName.textContent = t('home.error_name_required'); errName.classList.remove('hidden'); name.style.borderColor = '#ef4444'; shake(name); valid = false
    }
    if (!email.value.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
      errEmail.textContent = t('home.error_invalid_email'); errEmail.classList.remove('hidden'); email.style.borderColor = '#ef4444'; shake(email); valid = false
    }
    if (!msg.value.trim()) {
      errMsg.textContent = t('home.error_message_required'); errMsg.classList.remove('hidden'); msg.style.borderColor = '#ef4444'; shake(msg); valid = false
    }
    if (!valid) return

    const formContainer = document.getElementById('contactForm')
    if (formContainer) {
      formContainer.style.transition = 'opacity 0.4s ease-out, transform 0.4s ease-out'
      formContainer.style.opacity = '0'
      formContainer.style.transform = 'scale(0.96)'
      setTimeout(() => {
        formContainer.classList.add('hidden')
        const success = successRef.current
        if (success) {
          success.classList.remove('hidden')
          success.style.opacity = '0'
          success.style.transform = 'scale(0.92)'
          success.style.transition = 'opacity 0.5s ease-out, transform 0.5s ease-out'
          setTimeout(() => { success.style.opacity = '1'; success.style.transform = 'scale(1)' }, 20)
        }
      }, 400)
    }
  }

  return (
    <main className="min-h-screen bg-brand-900">
      <nav className="sticky top-0 z-50 border-b border-white/5 bg-brand-900/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <Logo href="/" theme="dark" />

          <div className="hidden md:flex items-center gap-8 text-sm">
            <Link href="/" className="font-medium text-white/80 hover:text-white transition-colors">{t('nav.home')}</Link>
            <Link href="#features" className="font-medium text-white/80 hover:text-white transition-colors">{t('nav.features')}</Link>
            <Link href="#precios" className="font-medium text-white/80 hover:text-white transition-colors">{t('nav.pricing')}</Link>
            <Link href="#contacto" className="font-medium text-white/80 hover:text-white transition-colors">{t('nav.contact')}</Link>
            <ThemeToggle />
            <LanguageSelector />
            <Link href="/login" className="px-5 py-2 text-sm font-semibold rounded-pill border border-white/20 text-white/80 hover:bg-white/5 transition-all duration-300">{t('nav.login')}</Link>
            <Link
              href="/register"
              className="px-5 py-2.5 text-sm font-semibold rounded-pill bg-gold-400 hover:bg-gold-500 text-brand-900 transition-all duration-300 hover:shadow-lg hover:shadow-gold-400/30"
            >
              {t('nav.signup')}
            </Link>
          </div>

          <button className="md:hidden text-white/70 hover:text-white" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {menuOpen && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="border-t border-white/5 bg-brand-850 md:hidden">
            <div className="flex flex-col gap-2 p-4">
              <Link href="/" className="rounded-lg px-3 py-2 text-white/80 hover:text-white hover:bg-white/5" onClick={() => setMenuOpen(false)}>{t('nav.home')}</Link>
              <Link href="#features" className="rounded-lg px-3 py-2 text-white/80 hover:text-white hover:bg-white/5" onClick={() => setMenuOpen(false)}>{t('nav.features')}</Link>
              <Link href="#precios" className="rounded-lg px-3 py-2 text-white/80 hover:text-white hover:bg-white/5" onClick={() => setMenuOpen(false)}>{t('nav.pricing')}</Link>
              <Link href="#contacto" className="rounded-lg px-3 py-2 text-white/80 hover:text-white hover:bg-white/5" onClick={() => setMenuOpen(false)}>{t('nav.contact')}</Link>
              <div className="px-3 py-2 flex items-center gap-2">
                <ThemeToggle />
                <LanguageSelector />
              </div>
              <Link href="/login" className="rounded-lg px-3 py-2 text-white/80 hover:text-white hover:bg-white/5" onClick={() => setMenuOpen(false)}>{t('nav.login')}</Link>
              <Link href="/register" className="mt-2 block w-full text-center px-5 py-2.5 text-sm font-semibold rounded-pill bg-gold-400 hover:bg-gold-500 text-brand-900 transition-all duration-300" onClick={() => setMenuOpen(false)}>{t('nav.signup')}</Link>
            </div>
          </motion.div>
        )}
      </nav>

      <Hero />
      <FeaturesGrid />
      <BentoGrid />
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
            <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-4">{t('home.contactTitle')}</h2>
            <p className="text-lg text-white/60 max-w-xl mx-auto">{t('home.contactDescription')}</p>
          </div>

          <div id="contactForm">
            <form ref={formRef} onSubmit={handleSubmit} noValidate>
              <div className="mb-6">
                <label className="block text-sm font-semibold text-white/80 mb-2">{t('home.contactName')}</label>
                <input id="field_name" type="text" placeholder={t('home.contactNamePlaceholder')} className="w-full bg-transparent border-b border-white/20 py-3 text-white placeholder-white/30 outline-none focus:border-gold-400 transition-colors duration-300 text-sm" />
                <div id="err_name" className="text-xs text-red-400 mt-1 hidden"></div>
              </div>
              <div className="mb-6">
                <label className="block text-sm font-semibold text-white/80 mb-2">{t('home.contactEmail')}</label>
                <input id="field_email" type="email" placeholder={t('home.contactEmailPlaceholder')} className="w-full bg-transparent border-b border-white/20 py-3 text-white placeholder-white/30 outline-none focus:border-gold-400 transition-colors duration-300 text-sm" />
                <div id="err_email" className="text-xs text-red-400 mt-1 hidden"></div>
              </div>
              <div className="mb-8">
                <label className="block text-sm font-semibold text-white/80 mb-2">{t('home.contactMessage')}</label>
                <textarea id="field_msg" placeholder={t('home.contactMessagePlaceholder')} rows={4} className="w-full bg-transparent border-b border-white/20 py-3 text-white placeholder-white/30 outline-none focus:border-gold-400 transition-colors duration-300 text-sm resize-none"></textarea>
                <div id="err_msg" className="text-xs text-red-400 mt-1 hidden"></div>
              </div>
              <button type="submit" className="w-full py-4 text-base font-semibold rounded-pill bg-gold-400 hover:bg-gold-500 text-brand-900 transition-all duration-300 hover:shadow-lg hover:shadow-gold-400/30">{t('home.contactSubmit')}</button>
            </form>
          </div>

          <div ref={successRef} className="hidden text-center">
            <div className="w-20 h-20 rounded-full bg-gold-400/20 flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-gold-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <h3 className="text-3xl font-extrabold text-white mb-3">{t('home.contactSuccessTitle')}</h3>
            <p className="text-white/60 text-lg">{t('home.contactSuccessDescription')}</p>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/5 bg-brand-900 py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <Logo theme="dark" className="mb-4" />
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

      <style>{`
        .shake { animation: shake 0.4s ease-in-out; }
        @keyframes shake { 0%,100% { transform: translateX(0); } 20% { transform: translateX(-6px); } 40% { transform: translateX(6px); } 60% { transform: translateX(-4px); } 80% { transform: translateX(4px); } }
      `}</style>
    </main>
  )
}
