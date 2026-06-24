'use client'

import { useTranslations } from 'next-intl'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'
import confetti from 'canvas-confetti'
import { QRCodeSVG } from 'qrcode.react'
import { DeviceSessionsPanel } from '@/modules/auth-enterprise/client/DeviceSessionsPanel'
import { MfaEnrollmentCard } from '@/modules/auth-enterprise/client/MfaEnrollmentCard'
import {
  User, Bell, CreditCard, Shield, CheckCircle2, Loader2, Save,
  Camera, X, Eye, EyeOff, MapPin, Globe, Smartphone, Key, LogOut,
  ChevronRight, ArrowUpRight, Clock, AlertTriangle, FileCode, RefreshCw, Crown
} from 'lucide-react'
import { useEffect, useState, useRef, useCallback } from 'react'

const SAMPLE_VALUES: Record<string, string> = {
  inquilino: 'Carlos López',
  inmueble: 'Edificio Mediterráneo - Cra 42 #12-34',
  renta: '$1,500,000',
  vencimiento: '15/julio/2026',
  arrendador: 'María García',
}

const DEFAULT_UPCOMING = 'Hola {inquilino},\n\nTe recordamos que el canon de arrendamiento correspondiente al inmueble {inmueble} por valor de {renta} tiene vencimiento el próximo {vencimiento}.\n\nAgradecemos realizar tu transferencia a tiempo.\n\nSaludos,\n{arrendador}'

const DEFAULT_OVERDUE = 'Estimado {inquilino},\n\nTe informamos que tu pago de alquiler de {renta} para la propiedad {inmueble} se encuentra VENCIDO desde el {vencimiento}.\n\nPor favor realiza el pago a la brevedad.\n\nAtentamente,\n{arrendador}'

const TABS = [
  { id: 'profile', labelKey: 'tab_profile', icon: User },
  { id: 'preferences', labelKey: 'tab_preferences', icon: Bell },
  { id: 'billing', labelKey: 'tab_billing', icon: CreditCard },
  { id: 'security', labelKey: 'tab_security', icon: Shield },
] as const

type TabId = typeof TABS[number]['id']

const MOCK_PAYMENTS = [
  { id: '1', date: '15/05/2026', plan: 'Profesional', amount: '$29.00', status: 'Pagado' },
  { id: '2', date: '15/04/2026', plan: 'Profesional', amount: '$29.00', status: 'Pagado' },
  { id: '3', date: '15/03/2026', plan: 'Starter', amount: '$0.00', status: 'Pagado' },
]

function renderTemplate(template: string, values: Record<string, string>): string {
  let result = template
  for (const [key, val] of Object.entries(values)) {
    result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), val)
  }
  return result
}

function TabButton({ tab, active, onClick, t }: { tab: typeof TABS[number]; active: boolean; onClick: () => void; t: (key: string) => string }) {
  const Icon = tab.icon
  return (
    <button type="button" onClick={onClick}
      className={`flex items-center gap-2.5 px-5 py-2.5 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer whitespace-nowrap ${
        active
          ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.15),inset_0_0_0_1.5px_rgba(245,158,11,0.4)] border border-amber-400/40'
          : 'text-muted-foreground hover:text-foreground bg-black/[0.02] dark:bg-white/[0.02] hover:bg-black/[0.04] dark:hover:bg-white/[0.04] border border-transparent'
      }`}>
      <Icon className={`w-4 h-4 ${active ? 'text-amber-500' : ''}`} />
      <span className="hidden sm:inline">{t(tab.labelKey)}</span>
    </button>
  )
}

function GlassCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-card/80 backdrop-blur-sm border border-border/60 rounded-xl p-5 shadow-[0_2px_12px_rgba(245,158,11,0.06),0_1px_2px_rgba(0,0,0,0.04)] ${className}`}>
      {children}
    </div>
  )
}

function validateEmail(v: string) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) }
function validatePhone(v: string) { return v.length >= 7 }

export default function SettingsPage() {
  const t = useTranslations('settings')
  const { user, profile, refreshProfile } = useAuth()
  const [activeTab, setActiveTab] = useState<TabId>('profile')

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragOver, setIsDragOver] = useState(false)

  const [preferredCurrency, setPreferredCurrency] = useState('COP')
  const [dateFormat, setDateFormat] = useState('DD/MM/YYYY')
  const [emailNotifs, setEmailNotifs] = useState(true)
  const [whatsappNotifs, setWhatsappNotifs] = useState(false)
  const [reminderDays, setReminderDays] = useState(3)
  const [enableAutoReminders, setEnableAutoReminders] = useState(true)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [twoFA, setTwoFA] = useState(false)
  const [twoFALoading, setTwoFALoading] = useState(false)
  const [twoFAMessage, setTwoFAMessage] = useState('')
  const [twoFAQr, setTwoFAQr] = useState<string | null>(null)
  const [twoFACode, setTwoFACode] = useState('')
  const [twoFAFactorId, setTwoFAFactorId] = useState<string | null>(null)
  const [twoFAInitialized, setTwoFAInitialized] = useState(false)

  const [upcomingTemplate, setUpcomingTemplate] = useState(DEFAULT_UPCOMING)
  const [overdueTemplate, setOverdueTemplate] = useState(DEFAULT_OVERDUE)
  const [showPreview, setShowPreview] = useState<'upcoming' | 'overdue' | null>(null)

  const [showPlanModal, setShowPlanModal] = useState(false)
  const [currentPlan, setCurrentPlan] = useState('Pro')
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [emailErr, setEmailErr] = useState('')
  const [phoneErr, setPhoneErr] = useState('')
  const [pwdErr, setPwdErr] = useState('')

  // Track initial values for "Discard changes"
  const [initialProfile, setInitialProfile] = useState<Record<string, unknown>>({})
  const isDirty = fullName !== (initialProfile.fullName as string)
    || phone !== (initialProfile.phone as string)
    || email !== (initialProfile.email as string)
    || preferredCurrency !== (initialProfile.preferredCurrency as string)
    || emailNotifs !== (initialProfile.emailNotifs as boolean)
    || whatsappNotifs !== (initialProfile.whatsappNotifs as boolean)
    || reminderDays !== (initialProfile.reminderDays as number)
    || enableAutoReminders !== (initialProfile.enableAutoReminders as boolean)
    || upcomingTemplate !== (initialProfile.upcomingTemplate as string)
    || overdueTemplate !== (initialProfile.overdueTemplate as string)
    || dateFormat !== (initialProfile.dateFormat as string)

  const handleDiscard = () => {
    setFullName(initialProfile.fullName as string || '')
    setPhone(initialProfile.phone as string || '')
    setEmail(initialProfile.email as string || '')
    setPreferredCurrency(initialProfile.preferredCurrency as string || 'COP')
    setEmailNotifs(initialProfile.emailNotifs as boolean ?? true)
    setWhatsappNotifs(initialProfile.whatsappNotifs as boolean ?? false)
    setReminderDays(initialProfile.reminderDays as number ?? 3)
    setEnableAutoReminders(initialProfile.enableAutoReminders as boolean ?? true)
    setUpcomingTemplate(initialProfile.upcomingTemplate as string || DEFAULT_UPCOMING)
    setOverdueTemplate(initialProfile.overdueTemplate as string || DEFAULT_OVERDUE)
    setDateFormat(initialProfile.dateFormat as string || 'DD/MM/YYYY')
    setErrorMsg('')
  }

  // Fetch initial MFA status from Supabase
  useEffect(() => {
    if (user && !twoFAInitialized) {
      supabase.auth.mfa.listFactors()
        .then(({ data, error }) => {
          if (!error && data?.all?.length) {
            setTwoFA(true)
            setTwoFAFactorId(data.all[0].id)
          }
        })
        .catch(() => {})
        .finally(() => setTwoFAInitialized(true))
    }
  }, [user, twoFAInitialized])

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '')
      setPhone(profile.phone || '')
      setEmail(user?.email || profile?.email || '')
      setPreferredCurrency(profile.preferred_currency || 'COP')
      const savedRemind = localStorage.getItem('RentNow_reminder_days')
      if (savedRemind) setReminderDays(Number(savedRemind))
      const savedAuto = localStorage.getItem('RentNow_auto_reminders')
      if (savedAuto) setEnableAutoReminders(savedAuto === 'true')
      const savedUp = localStorage.getItem('RentNow_template_upcoming')
      if (savedUp) setUpcomingTemplate(savedUp)
      const savedOver = localStorage.getItem('RentNow_template_overdue')
      if (savedOver) setOverdueTemplate(savedOver)
      const savedEmailN = localStorage.getItem('RentNow_email_notifs')
      if (savedEmailN) setEmailNotifs(savedEmailN === 'true')
      const savedWA = localStorage.getItem('RentNow_whatsapp_notifs')
      if (savedWA) setWhatsappNotifs(savedWA === 'true')
      const savedDF = localStorage.getItem('RentNow_date_format')
      if (savedDF) setDateFormat(savedDF)

      // Save initial snapshot for discard
      setInitialProfile({
        fullName: profile.full_name || '',
        phone: profile.phone || '',
        email: user?.email || profile?.email || '',
        preferredCurrency: profile.preferred_currency || 'COP',
        emailNotifs: savedEmailN ? savedEmailN === 'true' : true,
        whatsappNotifs: savedWA ? savedWA === 'true' : false,
        reminderDays: savedRemind ? Number(savedRemind) : 3,
        enableAutoReminders: savedAuto ? savedAuto === 'true' : true,
        upcomingTemplate: savedUp || DEFAULT_UPCOMING,
        overdueTemplate: savedOver || DEFAULT_OVERDUE,
        dateFormat: savedDF || 'DD/MM/YYYY',
      })
    }
  }, [profile, user])

  const handleAvatarDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) {
      setAvatarFile(file)
      setAvatarPreview(URL.createObjectURL(file))
    }
  }, [])

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setAvatarFile(file)
      setAvatarPreview(URL.createObjectURL(file))
    }
  }

  const validateFields = (): boolean => {
    let valid = true
    if (email && !validateEmail(email)) { setEmailErr('Email inválido'); valid = false } else setEmailErr('')
    if (phone && !validatePhone(phone)) { setPhoneErr('Teléfono muy corto'); valid = false } else setPhoneErr('')
    if (newPassword && newPassword.length < 6) { setPwdErr('Mínimo 6 caracteres'); valid = false } else setPwdErr('')
    if (newPassword && newPassword !== confirmPassword) { setPwdErr('Las contraseñas no coinciden'); valid = false }
    return valid
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !validateFields()) return
    setIsSaving(true)
    setSaveSuccess(false)
    setErrorMsg('')
    try {
      const updates: Record<string, unknown> = {
        full_name: fullName,
        phone,
        preferred_currency: preferredCurrency,
      }
      if (email !== (user?.email || profile?.email) && email) updates.email = email

      const { error: profileErr } = await supabase.from('profiles').update(updates).eq('id', user.id)
      if (profileErr) throw profileErr

      if (email !== (user?.email || profile?.email) && email && user.email !== email) {
        await supabase.auth.updateUser({ email })
      }

      // Save notification preferences to Supabase (not localStorage)
      const { error: notifErr } = await supabase.from('profiles').update({
        notification_preferences: {
          email: emailNotifs,
          push: false,
          whatsapp: whatsappNotifs,
          reminder_days: reminderDays,
          auto_reminders: enableAutoReminders,
        },
      }).eq('id', user.id)
      if (notifErr) console.error('Failed to save notification prefs:', notifErr)

      await refreshProfile()
      localStorage.setItem('RentNow_reminder_days', reminderDays.toString())
      localStorage.setItem('RentNow_auto_reminders', enableAutoReminders.toString())
      localStorage.setItem('RentNow_date_format', dateFormat)
      localStorage.setItem('RentNow_template_upcoming', upcomingTemplate)
      localStorage.setItem('RentNow_template_overdue', overdueTemplate)

      setSaveSuccess(true)
      confetti({ particleCount: 60, spread: 50, colors: ['#1e3a5f', '#2563eb'] })
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (err) {
      setErrorMsg(t('save_error'))
    } finally {
      setIsSaving(false)
    }
  }

  const handleToggle2FA = async () => {
    if (twoFA) {
      if (!twoFAFactorId) {
        setTwoFAMessage('No hay factor 2FA activo para desactivar')
        return
      }
      setTwoFALoading(true)
      setTwoFAMessage('')
      try {
        const { error } = await supabase.auth.mfa.unenroll({ factorId: twoFAFactorId })
        if (error) {
          setTwoFAMessage(error.message || 'Error al desactivar 2FA')
        } else {
          setTwoFA(false)
          setTwoFAQr(null)
          setTwoFAFactorId(null)
          setTwoFACode('')
          setTwoFAMessage('2FA desactivado correctamente')
        }
      } catch {
        setTwoFAMessage('Error de conexión')
      } finally {
        setTwoFALoading(false)
      }
    } else {
      setTwoFALoading(true)
      setTwoFAMessage('')
      try {
        const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp' })
        if (error) {
          setTwoFAMessage(error.message || 'No se pudo iniciar 2FA')
        } else if (data?.totp?.qr_code) {
          setTwoFAQr(data.totp.qr_code)
          setTwoFAFactorId(data.id)
        } else {
          setTwoFAMessage('No se recibió el código QR')
        }
      } catch {
        setTwoFAMessage('Error de conexión')
      } finally {
        setTwoFALoading(false)
      }
    }
  }

  const handleVerify2FA = async () => {
    if (!twoFAFactorId) return
    setTwoFALoading(true)
    try {
      const { data: challenge, error: challengeErr } = await supabase.auth.mfa.challenge({ factorId: twoFAFactorId })
      if (challengeErr) {
        setTwoFAMessage(challengeErr.message || 'Error al crear desafío')
        setTwoFALoading(false)
        return
      }
      const { error: verifyErr } = await supabase.auth.mfa.verify({
        factorId: twoFAFactorId,
        challengeId: challenge.id,
        code: twoFACode,
      })
      if (verifyErr) {
        setTwoFAMessage(verifyErr.message || 'Código inválido')
      } else {
        setTwoFA(true)
        setTwoFAQr(null)
        setTwoFAFactorId(null)
        setTwoFACode('')
        setTwoFAMessage('2FA activado correctamente')
      }
    } catch {
      setTwoFAMessage('Error de verificación')
    } finally {
      setTwoFALoading(false)
    }
  }

  const upcomingPreview = renderTemplate(upcomingTemplate, SAMPLE_VALUES)
  const overduePreview = renderTemplate(overdueTemplate, SAMPLE_VALUES)

  const inputCls = (err: string) =>
    `w-full bg-background border text-sm rounded-lg px-3 py-2.5 outline-none transition-all duration-200 ${
      err ? 'border-destructive ring-2 ring-destructive/30' : 'border-input focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500/60'
    }`

  const toggleCls = (on: boolean) =>
    `relative w-11 h-6 rounded-full transition-all cursor-pointer ${on ? 'bg-primary' : 'bg-border'}`

  return (
    <div className="max-w-5xl mx-auto pb-16 animate-fade-in">
      {saveSuccess && (
        <div className="fixed top-6 right-6 z-50 bg-blue-600 text-white px-5 py-3 rounded-lg shadow-[0_25px_50px_rgba(0,0,0,0.15)] text-xs font-bold flex items-center gap-2 animate-slide-up">
          <CheckCircle2 className="w-4 h-4" /> {t('saved_toast')}
        </div>
      )}

      <div className="mb-6">
        <p className="text-xs font-semibold tracking-wider text-muted-foreground">{t('page_label')}</p>
        <h1 className="text-xl md:text-2xl font-bold text-foreground mt-0.5">{t('page_title')}</h1>
        <p className="text-xs text-muted-foreground mt-1">{t('page_desc')}</p>
      </div>

      {/* Tab bar — pill style amber */}
      <div className="flex gap-2 overflow-x-auto pb-1 mb-6 bg-muted/30 p-1.5 rounded-2xl border border-border/40 backdrop-blur-sm">
        {TABS.map(tab => (
          <TabButton key={tab.id} tab={tab} active={activeTab === tab.id} onClick={() => setActiveTab(tab.id)} t={t} />
        ))}
      </div>

      <form onSubmit={handleSave} className="space-y-6">

        {/* TAB: Profile */}
        {activeTab === 'profile' && (
          <GlassCard>
            <h3 className="font-bold text-sm text-foreground flex items-center gap-2 pb-4 border-b border-border/60 mb-5">
              <User className="w-4 h-4 text-primary" /> {t('tab_profile')}
            </h3>

            {/* Avatar */}
            <div className="flex items-center gap-5 mb-6">
              <div
                onDrop={handleAvatarDrop}
                onDragOver={e => { e.preventDefault(); setIsDragOver(true) }}
                onDragLeave={() => setIsDragOver(false)}
                onClick={() => fileInputRef.current?.click()}
                className={`relative w-20 h-20 rounded-full overflow-hidden border-[2.5px] border-dashed cursor-pointer transition-all duration-200 ${
                  isDragOver ? 'border-amber-400 bg-amber-500/10 scale-105 shadow-[0_0_20px_rgba(245,158,11,0.2)]' : 'border-border/70 hover:border-amber-400/60 hover:shadow-[0_0_15px_rgba(245,158,11,0.1)]'
                }`}>
                {avatarPreview ? (
                  <img src={avatarPreview} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-muted text-muted-foreground">
                    <Camera className="w-6 h-6" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                  <Camera className="w-5 h-5 text-white" />
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{fullName || 'Tu nombre'}</p>
                <p className="text-xs text-muted-foreground">{t('avatar_hint')}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">{t('full_name')}</label>
                <input type="text" value={fullName} onChange={e => setFullName(e.target.value)}
                  placeholder={t('full_name_placeholder')} className={inputCls('')} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">{t('email_label')}</label>
                <input type="email" value={email} onChange={e => { setEmail(e.target.value); setEmailErr('') }}
                  placeholder="email@ejemplo.com" className={inputCls(emailErr)} />
                {emailErr && <p className="text-[10px] text-destructive mt-1">{emailErr}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">{t('phone_label')}</label>
                <input type="tel" value={phone} onChange={e => { setPhone(e.target.value); setPhoneErr('') }}
                  placeholder="+57 300 123 4567" className={inputCls(phoneErr)} />
                {phoneErr && <p className="text-[10px] text-destructive mt-1">{phoneErr}</p>}
              </div>
            </div>
          </GlassCard>
        )}

        {/* TAB: Preferences */}
        {activeTab === 'preferences' && (
          <GlassCard>
            <h3 className="font-bold text-sm text-foreground flex items-center gap-2 pb-4 border-b border-border/60 mb-5">
              <Bell className="w-4 h-4 text-primary" /> {t('tab_preferences')}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">{t('currency_label')}</label>
                <select value={preferredCurrency} onChange={e => setPreferredCurrency(e.target.value)}
                  className="w-full bg-background border border-input text-foreground text-sm rounded-lg px-3 py-2.5 outline-none focus:ring-1 focus:ring-ring cursor-pointer">
                  <option value="COP">COP — {t('currency_cop')}</option>
                  <option value="USD">USD — {t('currency_usd')}</option>
                  <option value="EUR">EUR — {t('currency_eur')}</option>
                  <option value="MXN">MXN — {t('currency_mxn')}</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">{t('date_format')}</label>
                <select value={dateFormat} onChange={e => setDateFormat(e.target.value)}
                  className="w-full bg-background border border-input text-foreground text-sm rounded-lg px-3 py-2.5 outline-none focus:ring-1 focus:ring-ring cursor-pointer">
                  <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                  <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                </select>
              </div>
            </div>

            {/* Notifications toggles */}
            <div className="mt-6 space-y-4">
              <p className="text-xs font-semibold text-foreground">{t('notifications_title')}</p>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm text-foreground font-medium">{t('email_notifs')}</span>
                  <p className="text-xs text-muted-foreground">{t('email_notifs_desc')}</p>
                </div>
                <button type="button" onClick={() => setEmailNotifs(!emailNotifs)} className={toggleCls(emailNotifs)}>
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all ${emailNotifs ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm text-foreground font-medium">{t('whatsapp_notifs')}</span>
                  <p className="text-xs text-muted-foreground">{t('whatsapp_notifs_desc')}</p>
                </div>
                <button type="button" onClick={() => setWhatsappNotifs(!whatsappNotifs)} className={toggleCls(whatsappNotifs)}>
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all ${whatsappNotifs ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>
            </div>

            {/* Auto reminders */}
            <div className="mt-6 pt-5 border-t border-border/60">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <span className="text-sm text-foreground font-medium">{t('auto_reminders')}</span>
                  <p className="text-xs text-muted-foreground">{t('auto_reminders_desc')}</p>
                </div>
                <button type="button" onClick={() => setEnableAutoReminders(!enableAutoReminders)} className={toggleCls(enableAutoReminders)}>
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all ${enableAutoReminders ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>
              {enableAutoReminders && (
                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span className="text-xs text-foreground">{t('send_reminder')}</span>
                  <input type="number" min="1" max="15" value={reminderDays}
                    onChange={e => setReminderDays(Number(e.target.value))}
                    className="w-16 bg-background border border-input text-foreground text-xs rounded-md text-center p-1.5 font-mono outline-none focus:ring-1 focus:ring-ring" />
                  <span className="text-xs text-muted-foreground">{t('days_before')}</span>
                </div>
              )}
            </div>

            {/* Templates */}
            <div className="mt-6 pt-5 border-t border-border/60 space-y-4">
              <p className="text-xs font-semibold text-foreground flex items-center gap-2">
                <FileCode className="w-4 h-4 text-primary" /> {t('templates_title')}
              </p>
              <div className="p-3 bg-muted/50 rounded-lg border border-border/60">
                <span className="text-xs font-semibold text-foreground block mb-1">{t('variables_label')}</span>
                <code className="text-[10px] text-muted-foreground">{t('template_variables_example')}</code>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-foreground">{t('upcoming_label')}</label>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground tabular-nums">{upcomingTemplate.length} chars</span>
                    <button type="button" onClick={() => setShowPreview(showPreview === 'upcoming' ? null : 'upcoming')}
                      className="text-[10px] text-primary font-semibold flex items-center gap-1 cursor-pointer hover:underline">
                      <Eye className="w-3 h-3" /> Preview
                    </button>
                    <button type="button" onClick={() => setUpcomingTemplate(DEFAULT_UPCOMING)}
                      className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-1 cursor-pointer">
                      <RefreshCw className="w-3 h-3" /> Reset
                    </button>
                  </div>
                </div>
                <textarea value={upcomingTemplate} onChange={e => setUpcomingTemplate(e.target.value)}
                  rows={4} className="w-full bg-background border border-input text-foreground text-xs rounded-lg px-3 py-2.5 outline-none focus:ring-1 focus:ring-ring resize-y font-mono leading-relaxed" />
                {showPreview === 'upcoming' && (
                  <div className="mt-2 p-3 bg-primary/5 border border-primary/10 rounded-lg">
                    <span className="text-[10px] font-semibold text-primary block mb-1">Preview</span>
                    <p className="text-xs text-foreground whitespace-pre-wrap">{upcomingPreview}</p>
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-destructive" /> {t('overdue_label')}
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground tabular-nums">{overdueTemplate.length} chars</span>
                    <button type="button" onClick={() => setShowPreview(showPreview === 'overdue' ? null : 'overdue')}
                      className="text-[10px] text-primary font-semibold flex items-center gap-1 cursor-pointer hover:underline">
                      <Eye className="w-3 h-3" /> Preview
                    </button>
                    <button type="button" onClick={() => setOverdueTemplate(DEFAULT_OVERDUE)}
                      className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-1 cursor-pointer">
                      <RefreshCw className="w-3 h-3" /> Reset
                    </button>
                  </div>
                </div>
                <textarea value={overdueTemplate} onChange={e => setOverdueTemplate(e.target.value)}
                  rows={4} className="w-full bg-background border border-input text-foreground text-xs rounded-lg px-3 py-2.5 outline-none focus:ring-1 focus:ring-ring resize-y font-mono leading-relaxed" />
                {showPreview === 'overdue' && (
                  <div className="mt-2 p-3 bg-destructive/5 border border-destructive/10 rounded-lg">
                    <span className="text-[10px] font-semibold text-destructive block mb-1">Preview</span>
                    <p className="text-xs text-foreground whitespace-pre-wrap">{overduePreview}</p>
                  </div>
                )}
              </div>
            </div>
          </GlassCard>
        )}

        {/* TAB: Billing */}
        {activeTab === 'billing' && (
          <GlassCard>
            <h3 className="font-bold text-sm text-foreground flex items-center gap-2 pb-4 border-b border-border/60 mb-5">
              <CreditCard className="w-4 h-4 text-primary" /> {t('tab_billing')}
            </h3>

            <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl p-5 border border-primary/20 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{t('current_plan')}</p>
                  <p className="text-lg font-black text-foreground mt-1">{t('plan_pro')}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">$29.00/mes — {t('plan_features')}</p>
                </div>
                <span className="px-3 py-1 rounded-full bg-success/10 text-success text-[10px] font-bold border border-success/20">
                  {t('plan_active')}
                </span>
              </div>
              <button type="button" onClick={() => setShowPlanModal(true)} className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-bold rounded-lg transition-all cursor-pointer">
                {t('upgrade_btn')} <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <p className="text-xs font-semibold text-foreground mb-3">{t('payment_history')}</p>
            <div className="space-y-2">
              {MOCK_PAYMENTS.map(p => (
                <div key={p.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border/50 text-xs">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-4 h-4 text-success" />
                    <div>
                      <p className="font-semibold text-foreground">{p.plan} — {p.amount}</p>
                      <p className="text-muted-foreground">{p.date}</p>
                    </div>
                  </div>
                  <span className="text-success font-semibold">{p.status}</span>
                </div>
              ))}
            </div>
          </GlassCard>
        )}

        {/* Plan selection modal */}
        {showPlanModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setShowPlanModal(false)}>
            <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-brand-900/95 p-6 shadow-glass backdrop-blur-2xl animate-scale-in" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Crown className="w-4 h-4 text-amber-400" /> Seleccionar Plan
                </h3>
                <button type="button" onClick={() => setShowPlanModal(false)} className="text-white/40 hover:text-white/80 cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-3">
                {[
                  { name: 'Básico', price: '$0', features: '3 propiedades, reportes básicos', popular: false, current: currentPlan === 'Básico' },
                  { name: 'Pro', price: '$29', features: '10 propiedades, IA, reportes ilimitados', popular: true, current: currentPlan === 'Pro' },
                  { name: 'Enterprise', price: '$99', features: 'Ilimitado, API, soporte prioritario', popular: false, current: currentPlan === 'Enterprise' },
                ].map((plan) => (
                  <div key={plan.name}
                    className={`relative flex items-center justify-between rounded-xl border p-4 transition-all cursor-pointer ${
                      plan.current
                        ? 'border-amber-400/60 bg-amber-400/10'
                        : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/[0.07]'
                    }`}
                    onClick={() => {
                      setCurrentPlan(plan.name)
                      setShowPlanModal(false)
                    }}
                  >
                    <div className="flex items-center gap-3">
                      {plan.popular && (
                        <span className="absolute -top-2 left-4 rounded-full bg-amber-400 px-2 py-0.5 text-[9px] font-bold text-brand-900">MÁS POPULAR</span>
                      )}
                      <div className={plan.popular ? 'mt-3' : ''}>
                        <p className="text-sm font-bold text-white">{plan.name}</p>
                        <p className="text-[10px] text-white/40">{plan.features}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-black text-white">{plan.price}<span className="text-xs font-normal text-white/40">/mes</span></span>
                      {plan.current ? (
                        <span className="rounded-full bg-amber-400/20 px-2.5 py-0.5 text-[10px] font-bold text-amber-400 border border-amber-400/30">Actual</span>
                      ) : (
                        <button type="button" className="rounded-lg bg-amber-400 px-3.5 py-1.5 text-[10px] font-bold text-brand-900 hover:bg-amber-300 transition-colors"
                          onClick={(e) => { e.stopPropagation(); setCurrentPlan(plan.name); setShowPlanModal(false) }}>
                          Seleccionar
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB: Security */}
        {activeTab === 'security' && (
          <GlassCard>
            <h3 className="font-bold text-sm text-foreground flex items-center gap-2 pb-4 border-b border-border/60 mb-5">
              <Shield className="w-4 h-4 text-primary" /> {t('tab_security')}
            </h3>

            {/* Change password */}
            <div className="mb-6 pb-6 border-b border-border/60">
              <p className="text-xs font-semibold text-foreground mb-3">{t('change_password')}</p>
              <div className="space-y-3">
                <div className="relative">
                  <input type={showPwd ? 'text' : 'password'} value={currentPassword}
                    onChange={e => setCurrentPassword(e.target.value)} placeholder={t('current_pwd')}
                    className={inputCls('') + ' pr-10'} />
                </div>
                <div className="relative">
                  <input type={showPwd ? 'text' : 'password'} value={newPassword}
                    onChange={e => { setNewPassword(e.target.value); setPwdErr('') }}
                    placeholder={t('new_pwd')} className={inputCls(pwdErr) + ' pr-10'} />
                  <button type="button" onClick={() => setShowPwd(!showPwd)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground cursor-pointer">
                    {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <input type={showPwd ? 'text' : 'password'} value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)} placeholder={t('confirm_pwd')}
                  className={inputCls(pwdErr)} />
                {pwdErr && <p className="text-[10px] text-destructive">{pwdErr}</p>}
              </div>
            </div>

            {/* 2FA */}
            <div className="mb-6 pb-6 border-b border-border/60">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm text-foreground font-medium">{t('twofa_label')}</span>
                  <p className="text-xs text-muted-foreground">{t('twofa_desc')}</p>
                </div>
                <button type="button" onClick={handleToggle2FA} disabled={twoFALoading} className={toggleCls(twoFA)}>
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all ${twoFA ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>
              {twoFALoading && !twoFAQr && (
                <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" /> Procesando...
                </div>
              )}
              {twoFAQr && (
                <div className="mt-4 space-y-3 rounded-xl border border-border bg-muted/30 p-4">
                  <p className="text-xs font-semibold text-foreground">Escanea este código QR con tu app de autenticación (Google Authenticator, Authy, etc.)</p>
                  <div className="flex justify-center">
                    <QRCodeSVG value={twoFAQr} size={160} level="M" />
                  </div>
                  <input
                    value={twoFACode}
                    onChange={(e) => setTwoFACode(e.target.value)}
                    placeholder="Código de 6 dígitos"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-500/40"
                  />
                  <button
                    type="button"
                    onClick={handleVerify2FA}
                    disabled={twoFALoading || twoFACode.length < 6}
                    className="w-full rounded-xl bg-primary py-2 text-xs font-bold text-primary-foreground disabled:opacity-50"
                  >
                    {twoFALoading ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : 'Verificar y activar'}
                  </button>
                </div>
              )}
              {twoFAMessage && (
                <p className="mt-2 text-xs text-muted-foreground">{twoFAMessage}</p>
              )}
            </div>

            {/* MFA + Devices from auth-enterprise */}
            <MfaEnrollmentCard />
            <div className="mt-4">
              <DeviceSessionsPanel />
            </div>
          </GlassCard>
        )}

        {/* Action bar */}
        <div className="flex items-center justify-between p-5 bg-card/80 backdrop-blur-sm border border-border/60 rounded-2xl shadow-[0_4px_24px_rgba(245,158,11,0.08)] sticky bottom-4">
          <div className="flex items-center gap-3">
            {errorMsg && <span className="text-xs text-destructive font-semibold">{errorMsg}</span>}
            {saveSuccess && (
              <span className="text-xs text-success font-semibold flex items-center gap-1 animate-fade-in">
                <CheckCircle2 className="w-4 h-4" /> {t('saved_short')}
              </span>
            )}
            <span className="text-[10px] text-muted-foreground/60 hidden sm:block">{t('auto_save_hint')}</span>
          </div>
          <div className="flex items-center gap-3">
            <button type="button" onClick={handleDiscard} disabled={!isDirty}
              className="px-4 py-2.5 rounded-xl border border-border/70 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-150 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed">
              {t('discard')}
            </button>
            <button type="submit" disabled={isSaving || !isDirty}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white shadow-lg transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
              style={{
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #b45309 100%)',
                boxShadow: '0 4px 14px rgba(245,158,11,0.35)',
              }}>
              {isSaving ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> {t('saving')}</>
              ) : (
                <><Save className="w-4 h-4" /> {t('save_changes')}</>
              )}
            </button>
          </div>
        </div>

      </form>
    </div>
  )
}
