'use client';

import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import confetti from 'canvas-confetti';
import { DeviceSessionsPanel } from '@/modules/auth-enterprise/client/DeviceSessionsPanel';
import { MfaEnrollmentCard } from '@/modules/auth-enterprise/client/MfaEnrollmentCard';
import { AlertTriangle,Bell,CheckCircle2,Clock,FileCode,Loader2,Save,Shield,User } from 'lucide-react';
import { useEffect,useState } from 'react';

export default function SettingsPage() {
  const { user, profile, refreshProfile } = useAuth();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [preferredCurrency, setPreferredCurrency] = useState('COP');
  const [reminderDays, setReminderDays] = useState(3);
  const [enableAutoReminders, setEnableAutoReminders] = useState(true);

  const [upcomingTemplate, setUpcomingTemplate] = useState(
    'Hola {inquilino},\n\nTe recordamos que el canon de arrendamiento correspondiente al inmueble {inmueble} por valor de {renta} tiene vencimiento el próximo {vencimiento}.\n\nAgradecemos realizar tu transferencia a tiempo.\n\nSaludos,\n{arrendador}'
  );

  const [overdueTemplate, setOverdueTemplate] = useState(
    'Estimado {inquilino},\n\nTe informamos que tu pago de alquiler de {renta} para la propiedad {inmueble} se encuentra VENCIDO desde el {vencimiento}.\n\nPor favor realiza el pago a la brevedad.\n\nAtentamente,\n{arrendador}'
  );

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (profile) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFullName(profile.full_name || '');
      setPhone(profile.phone || '');
      setPreferredCurrency(profile.preferred_currency || 'COP');
      const savedRemind = localStorage.getItem('RentNow_reminder_days');
      if (savedRemind) setReminderDays(Number(savedRemind));
      const savedAuto = localStorage.getItem('RentNow_auto_reminders');
      if (savedAuto) setEnableAutoReminders(savedAuto === 'true');
      const savedUp = localStorage.getItem('RentNow_template_upcoming');
      if (savedUp) setUpcomingTemplate(savedUp);
      const savedOver = localStorage.getItem('RentNow_template_overdue');
      if (savedOver) setOverdueTemplate(savedOver);
    }
  }, [profile]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSaving(true);
    setSaveSuccess(false);
    setErrorMsg('');
    try {
      const { error: profileErr } = await supabase
        .from('profiles')
        .update({ full_name: fullName, phone, preferred_currency: preferredCurrency })
        .eq('id', user.id);
      if (profileErr) throw profileErr;
      await refreshProfile();
      localStorage.setItem('RentNow_reminder_days', reminderDays.toString());
      localStorage.setItem('RentNow_auto_reminders', enableAutoReminders.toString());
      localStorage.setItem('RentNow_template_upcoming', upcomingTemplate);
      localStorage.setItem('RentNow_template_overdue', overdueTemplate);
      setSaveSuccess(true);
      confetti({ particleCount: 60, spread: 50, colors: ['#1e3a5f', '#2563eb'] });
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Error saving settings:', err);
      setErrorMsg('Error al guardar la configuración.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-16 animate-fade-in">

      {/* Toast */}
      {saveSuccess && (
        <div className="fixed top-6 right-6 z-50 bg-blue-600 text-white px-5 py-3 rounded-lg shadow-[0_25px_50px_rgba(0,0,0,0.15)] text-xs font-bold flex items-center gap-2 animate-slide-up">
          <CheckCircle2 className="w-4 h-4" />
          Configuración guardada
        </div>
      )}

      {/* Header */}
      <div>
        <p className="text-xs font-semibold tracking-wider text-muted-foreground">Configuración</p>
        <h2 className="text-xl md:text-2xl font-bold text-foreground mt-0.5">Ajustes de la Plataforma</h2>
        <p className="text-xs text-muted-foreground mt-1">Personaliza tu perfil, notificaciones y plantillas de correo.</p>
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-6">

        {/* Profile */}
        <div className="bg-card border border-border rounded-lg p-6 space-y-5 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_2px_4px_rgba(0,0,0,0.04)]">
          <h3 className="font-bold text-sm text-foreground flex items-center gap-2 pb-4 border-b border-border">
            <User className="w-4 h-4 text-primary" />
            Datos del Perfil
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">Nombre Completo</label>
              <input type="text" required value={fullName} onChange={e => setFullName(e.target.value)}
                placeholder="Tu nombre o razón social"
                className="w-full bg-background border border-input text-foreground text-sm rounded-md px-3 py-2.5 outline-none focus:ring-1 focus:ring-ring transition-all" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">Teléfono</label>
              <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                placeholder="+57 300 123 4567"
                className="w-full bg-background border border-input text-foreground text-sm rounded-md px-3 py-2.5 outline-none focus:ring-1 focus:ring-ring transition-all" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">Moneda Preferida</label>
              <select value={preferredCurrency} onChange={e => setPreferredCurrency(e.target.value)}
                className="w-full bg-background border border-input text-foreground text-sm rounded-md px-3 py-2.5 outline-none focus:ring-1 focus:ring-ring transition-all cursor-pointer">
                <option value="COP">COP — Peso Colombiano</option>
                <option value="USD">USD — Dólar</option>
                <option value="EUR">EUR — Euro</option>
                <option value="MXN">MXN — Peso Mexicano</option>
              </select>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-card border border-border rounded-lg p-6 space-y-5 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_2px_4px_rgba(0,0,0,0.04)]">
          <h3 className="font-bold text-sm text-foreground flex items-center gap-2 pb-4 border-b border-border">
            <Bell className="w-4 h-4 text-primary" />
            Recordatorios
          </h3>
          <div className="flex items-center justify-between">
            <div>
              <span className="font-semibold text-sm text-foreground block">Recordatorios automáticos</span>
              <span className="text-xs text-muted-foreground">Notifica a los inquilinos sobre pagos próximos.</span>
            </div>
            <button
              type="button"
              onClick={() => setEnableAutoReminders(!enableAutoReminders)}
              className={`relative w-11 h-6 rounded-full transition-all cursor-pointer ${
                enableAutoReminders ? 'bg-primary' : 'bg-border'
              }`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all ${
                enableAutoReminders ? 'translate-x-5' : 'translate-x-0'
              }`} />
            </button>
          </div>
          {enableAutoReminders && (
            <div className="flex items-center gap-3 pt-1">
              <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="text-xs text-foreground">Enviar recordatorio</span>
              <input type="number" min="1" max="15" value={reminderDays}
                onChange={e => setReminderDays(Number(e.target.value))}
                className="w-16 bg-background border border-input text-foreground text-xs rounded-md text-center p-1.5 font-mono outline-none focus:ring-1 focus:ring-ring" />
              <span className="text-xs text-muted-foreground">días antes del vencimiento.</span>
            </div>
          )}
        </div>

        {/* Email templates */}
        <div className="bg-card border border-border rounded-lg p-6 space-y-5 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_2px_4px_rgba(0,0,0,0.04)]">
          <h3 className="font-bold text-sm text-foreground flex items-center gap-2 pb-4 border-b border-border">
            <FileCode className="w-4 h-4 text-primary" />
            Plantillas de Correo
          </h3>
          <div className="p-3 bg-muted rounded-md border border-border text-xs text-muted-foreground">
            <span className="font-semibold text-foreground block mb-1">Variables: </span>
            <code className="text-[11px]">{'{inquilino}'} {'{inmueble}'} {'{renta}'} {'{vencimiento}'} {'{arrendador}'}</code>
          </div>
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">Recordatorio de pago próximo</label>
            <textarea value={upcomingTemplate} onChange={e => setUpcomingTemplate(e.target.value)}
              rows={4} className="w-full bg-background border border-input text-foreground text-xs rounded-md px-3 py-2.5 outline-none focus:ring-1 focus:ring-ring resize-y font-mono leading-relaxed" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-destructive" />
              Aviso de pago vencido
            </label>
            <textarea value={overdueTemplate} onChange={e => setOverdueTemplate(e.target.value)}
              rows={4} className="w-full bg-background border border-input text-foreground text-xs rounded-md px-3 py-2.5 outline-none focus:ring-1 focus:ring-ring resize-y font-mono leading-relaxed" />
          </div>
        </div>

        {/* Módulo auth-enterprise: MFA + dispositivos */}
        <div className="rounded-2xl border border-border bg-card p-5 space-y-6">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            <h2 className="text-sm font-black uppercase tracking-wider text-foreground">Seguridad de cuenta</h2>
          </div>
          <MfaEnrollmentCard />
          <DeviceSessionsPanel />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          {errorMsg && <span className="text-xs text-destructive font-semibold">{errorMsg}</span>}
          <div className="flex items-center gap-4 ml-auto">
            {saveSuccess && (
              <span className="text-xs text-success font-semibold flex items-center gap-1 animate-fade-in">
                <CheckCircle2 className="w-4 h-4" /> Guardado
              </span>
            )}
            <button type="submit" disabled={isSaving}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary-hover disabled:opacity-50 text-primary-foreground font-semibold rounded-md shadow-[0_2px_8px_rgba(37,99,235,0.2)] text-sm transition-all cursor-pointer disabled:cursor-not-allowed">
              {isSaving ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Guardando...</>
              ) : (
                <><Save className="w-4 h-4" /> Guardar Cambios</>
              )}
            </button>
          </div>
        </div>

      </form>
    </div>
  );
}
