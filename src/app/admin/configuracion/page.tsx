'use client';

import { StripeCheckoutButton } from '@/components/payments/StripeCheckoutButton';
import { useAuth } from '@/context/AuthContext';
import { ArrowLeft, CreditCard, ExternalLink, Loader2, Save } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface ConfigStatus {
  configured: boolean;
  source: string | null;
  siteUrl: string | null;
  stripeSecretKeyPreview: string | null;
  stripeWebhookSecretPreview: string | null;
  updatedAt: string | null;
}

export default function ConfiguracionSistemaPage() {
  const { user } = useAuth();
  const [testEmail, setTestEmail] = useState('');
  const [status, setStatus] = useState<ConfigStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    stripe_secret_key: '',
    stripe_webhook_secret: '',
    next_public_site_url: 'http://localhost:3000',
    stripe_publishable_key: '',
  });

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/system-config');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo cargar');
      setStatus(data);
      if (data.siteUrl) {
        setForm((f) => ({ ...f, next_public_site_url: data.siteUrl }));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error de carga');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (user?.email) setTestEmail(user.email);
  }, [user?.email]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');
    try {
      const res = await fetch('/api/admin/system-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al guardar');
      setMessage(data.message || 'Guardado correctamente');
      setForm((f) => ({
        ...f,
        stripe_secret_key: '',
        stripe_webhook_secret: '',
      }));
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-2xl mx-auto px-5 py-10 space-y-6">
        <Link href="/admin" className="inline-flex items-center gap-2 text-sm font-bold text-primary">
          <ArrowLeft className="w-4 h-4" />
          Volver a admin
        </Link>

        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-primary/10 text-primary">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-foreground">Configuración Stripe (BD)</h1>
            <p className="text-sm text-muted-foreground">
              Tabla <code className="text-xs">configuracion_sistema</code> — white-label para el comprador del SaaS
            </p>
          </div>
        </div>

        {loading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            Cargando…
          </div>
        )}

        {status && (
          <div className="rounded-xl border border-border bg-card p-4 text-sm space-y-1">
            <p>
              Estado:{' '}
              <strong className={status.configured ? 'text-success' : 'text-warning'}>
                {status.configured ? 'Configurado' : 'Pendiente'}
              </strong>{' '}
              ({status.source ?? 'sin fuente'})
            </p>
            {status.stripeSecretKeyPreview && (
              <p className="text-muted-foreground">Secret key: {status.stripeSecretKeyPreview}</p>
            )}
            {status.updatedAt && (
              <p className="text-muted-foreground text-xs">
                Actualizado: {new Date(status.updatedAt).toLocaleString('es-CO')}
              </p>
            )}
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}
        {message && (
          <div className="rounded-lg border border-success/30 bg-success/10 p-3 text-sm text-success">
            {message}
          </div>
        )}

        <form onSubmit={handleSave} className="rounded-2xl border border-border bg-card p-6 space-y-4">
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase">Stripe Secret Key</label>
            <input
              type="password"
              className="mt-1 w-full rounded-xl border border-border px-3 py-2 text-sm"
              placeholder="sk_test_... o sk_live_..."
              value={form.stripe_secret_key}
              onChange={(e) => setForm({ ...form, stripe_secret_key: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase">Webhook Secret</label>
            <input
              type="password"
              className="mt-1 w-full rounded-xl border border-border px-3 py-2 text-sm"
              placeholder="whsec_..."
              value={form.stripe_webhook_secret}
              onChange={(e) => setForm({ ...form, stripe_webhook_secret: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase">Site URL</label>
            <input
              type="url"
              className="mt-1 w-full rounded-xl border border-border px-3 py-2 text-sm"
              value={form.next_public_site_url}
              onChange={(e) => setForm({ ...form, next_public_site_url: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase">
              Publishable Key (opcional)
            </label>
            <input
              type="text"
              className="mt-1 w-full rounded-xl border border-border px-3 py-2 text-sm"
              placeholder="pk_test_..."
              value={form.stripe_publishable_key}
              onChange={(e) => setForm({ ...form, stripe_publishable_key: e.target.value })}
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Guardar en base de datos
          </button>
        </form>

        {status?.configured && (
          <section className="rounded-2xl border border-indigo-500/30 bg-indigo-500/5 p-6 space-y-4">
            <div className="flex items-center gap-2">
              <ExternalLink className="w-5 h-5 text-indigo-400" />
              <h2 className="font-bold text-foreground">Probar desde la plataforma</h2>
            </div>
            <p className="text-xs text-muted-foreground">
              Lanza un checkout real con las llaves guardadas en la base de datos. Usa tarjeta de prueba{' '}
              <strong>4242 4242 4242 4242</strong> en modo test.
            </p>
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase">Email de prueba</label>
              <input
                type="email"
                className="mt-1 w-full rounded-xl border border-border px-3 py-2 text-sm"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="tu@email.com"
              />
            </div>
            <StripeCheckoutButton
              planId="profesional"
              planName="RentNow Profesional (prueba admin)"
              amountUsd={12}
              label="Probar checkout Stripe $12 USD"
              customerEmail={testEmail || undefined}
            />
            <p className="text-[10px] text-muted-foreground">
              También puedes ir a{' '}
              <Link href="/precios" className="text-primary font-bold hover:underline">
                /precios
              </Link>{' '}
              (los botones usarán Stripe si está configurado).
            </p>
          </section>
        )}
      </main>
    </div>
  );
}
