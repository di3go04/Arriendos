'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import {
  Settings,
  User,
  DollarSign,
  Mail,
  Bell,
  Clock,
  Save,
  CheckCircle2,
  Loader2,
  FileCode,
  Globe,
  AlertTriangle
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function SettingsPage() {
  const { user, profile, refreshProfile } = useAuth();
  
  const [fullName, setFullName] = useState('');
  const [preferredCurrency, setPreferredCurrency] = useState('USD');
  const [reminderDays, setReminderDays] = useState(3);
  const [enableAutoReminders, setEnableAutoReminders] = useState(true);

  // Email Template variables
  const [upcomingTemplate, setUpcomingTemplate] = useState(
    'Hola {inquilino},\n\nTe recordamos que el canon de arrendamiento correspondiente al inmueble {inmueble} por valor de {renta} tiene vencimiento el próximo {vencimiento}.\n\nAgradecemos realizar tu transferencia a tiempo.\n\nSaludos,\n{arrendador}'
  );
  
  const [overdueTemplate, setOverdueTemplate] = useState(
    'Estimado {inquilino},\n\nTe informamos que tu pago de alquiler de {renta} para la propiedad {inmueble} se encuentra VENCIDO desde el {vencimiento}.\n\nPor favor realiza el pago a la brevedad para evitar recargos o penalizaciones.\n\nAtentamente,\n{arrendador}'
  );

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setPreferredCurrency(profile.preferred_currency || 'USD');
      
      // Load saved preferences if available in localStorage
      const savedRemind = localStorage.getItem('arrendo_reminder_days');
      if (savedRemind) setReminderDays(Number(savedRemind));

      const savedAuto = localStorage.getItem('arrendo_auto_reminders');
      if (savedAuto) setEnableAutoReminders(savedAuto === 'true');

      const savedUp = localStorage.getItem('arrendo_template_upcoming');
      if (savedUp) setUpcomingTemplate(savedUp);

      const savedOver = localStorage.getItem('arrendo_template_overdue');
      if (savedOver) setOverdueTemplate(savedOver);
    }
  }, [profile]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSaving(true);
    setSaveSuccess(false);

    try {
      // 1. Update profiles table in Supabase
      const { error: profileErr } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          preferred_currency: preferredCurrency
        })
        .eq('id', user.id);

      if (profileErr) throw profileErr;

      // 2. Refresh Context
      await refreshProfile();

      // 3. Save other UI notification rules locally
      localStorage.setItem('arrendo_reminder_days', reminderDays.toString());
      localStorage.setItem('arrendo_auto_reminders', enableAutoReminders.toString());
      localStorage.setItem('arrendo_template_upcoming', upcomingTemplate);
      localStorage.setItem('arrendo_template_overdue', overdueTemplate);

      // Trigger celebrate splash!
      setSaveSuccess(true);
      confetti({ particleCount: 60, spread: 50, colors: ['#3b82f6', '#10b981'] });
      
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Error saving settings profile:', err);
      alert('Hubo un problema al intentar guardar la configuración.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      
      {/* Top Header */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Panel de Control
        </p>
        <h2 className="text-xl md:text-2xl font-black text-foreground">
          Ajustes de la Plataforma
        </h2>
      </div>

      {/* Main Settings Form */}
      <form onSubmit={handleSaveSettings} className="space-y-6">
        
        {/* Module 1: Personal Landlord Info */}
        <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-4">
          <h3 className="font-extrabold text-sm text-foreground flex items-center gap-2 pb-3 border-b border-border">
            <User className="w-4.5 h-4.5 text-primary" /> Datos del Arrendador
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                Nombre Completo / Razón Social
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Nombre comercial o personal"
                className="w-full bg-muted border border-border text-foreground text-xs rounded-lg p-3 outline-none focus:ring-1 focus:ring-ring font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                Divisa Monetaria Preferida
              </label>
              <select
                value={preferredCurrency}
                onChange={(e) => setPreferredCurrency(e.target.value)}
                className="w-full bg-muted border border-border text-foreground text-xs rounded-lg p-3 outline-none font-semibold focus:ring-1 focus:ring-ring"
              >
                <option value="COP">Peso Colombiano (COP - $)</option>
                <option value="USD">Dólar Estadounidense (USD - $)</option>
                <option value="EUR">Euro (EUR - €)</option>
                <option value="MXN">Peso Mexicano (MXN - $)</option>
                <option value="ARS">Peso Argentino (ARS - $)</option>
                <option value="CLP">Peso Chileno (CLP - $)</option>
                <option value="PEN">Sol Peruano (PEN - S/)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Module 2: Automatic reminders */}
        <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-4">
          <h3 className="font-extrabold text-sm text-foreground flex items-center gap-2 pb-3 border-b border-border">
            <Bell className="w-4.5 h-4.5 text-warning" /> Recordatorios y Alertas
          </h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-bold text-xs text-foreground block">
                  Habilitar Recordatorios Automáticos
                </span>
                <span className="text-[10px] text-muted-foreground">
                  Envía notificaciones de cobro a los correos de tus inquilinos de manera automática.
                </span>
              </div>
              <input
                type="checkbox"
                checked={enableAutoReminders}
                onChange={(e) => setEnableAutoReminders(e.target.checked)}
                className="w-4.5 h-4.5 text-primary bg-muted border-border rounded focus:ring-1 cursor-pointer"
              />
            </div>

            {enableAutoReminders && (
              <div className="flex items-center gap-3 pt-2">
                <Clock className="w-4.5 h-4.5 text-muted-foreground shrink-0" />
                <div className="flex items-center gap-2 text-xs">
                  <span>Enviar recordatorio de cobro</span>
                  <input
                    type="number"
                    min="1"
                    max="15"
                    value={reminderDays}
                    onChange={(e) => setReminderDays(Number(e.target.value))}
                    className="w-16 bg-muted border border-border text-foreground rounded text-center p-1.5 font-bold font-mono outline-none"
                  />
                  <span>días antes de la fecha de vencimiento.</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Module 3: Email customizer templates */}
        <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-4">
          <h3 className="font-extrabold text-sm text-foreground flex items-center gap-2 pb-3 border-b border-border">
            <Mail className="w-4.5 h-4.5 text-primary" /> Plantillas de Correo Electrónico
          </h3>

          {/* Placeholders info */}
          <div className="p-3.5 bg-muted rounded-xl border border-border text-[10px] text-muted-foreground space-y-1">
            <span className="font-bold text-foreground block">Variables dinámicas soportadas:</span>
            <p>
              `{`{inquilino}`}`: Nombre del inquilino, `{`{inmueble}`}`: Nombre del inmueble, `{`{renta}`}`: Monto de la renta con divisa, `{`{vencimiento}`}`: Fecha límite de pago, `{`{arrendador}`}`: Tu nombre comercial.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <FileCode className="w-3.5 h-3.5" /> Plantilla de Cobro Próximo (Preventivo)
              </label>
              <textarea
                value={upcomingTemplate}
                onChange={(e) => setUpcomingTemplate(e.target.value)}
                rows={5}
                className="w-full bg-muted border border-border text-foreground text-xs rounded-lg p-3 outline-none resize-none font-mono leading-relaxed"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-destructive" /> Plantilla de Cobro Vencido (Mora)
              </label>
              <textarea
                value={overdueTemplate}
                onChange={(e) => setOverdueTemplate(e.target.value)}
                rows={5}
                className="w-full bg-muted border border-border text-foreground text-xs rounded-lg p-3 outline-none resize-none font-mono leading-relaxed"
              />
            </div>
          </div>
        </div>

        {/* Global Save Button */}
        <div className="flex items-center justify-end gap-4">
          {saveSuccess && (
            <span className="text-xs text-success font-bold flex items-center gap-1 animate-fade-in">
              <CheckCircle2 className="w-4 h-4" /> ¡Configuración guardada!
            </span>
          )}
          <button
            type="submit"
            disabled={isSaving}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl shadow-lg shadow-primary/10 transition-all text-xs cursor-pointer"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Guardando...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Guardar Cambios</span>
              </>
            )}
          </button>
        </div>

      </form>

    </div>
  );
}
