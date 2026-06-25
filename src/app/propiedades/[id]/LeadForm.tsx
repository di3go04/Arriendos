'use client';

import { Check,Loader2,Send } from 'lucide-react';
import { useState } from 'react';

interface LeadFormProps {
  propertyId: string;
  propertyTitle: string;
  ownerId: string;
}

export default function LeadForm({ propertyId, propertyTitle, ownerId }: LeadFormProps) {
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', message: '' });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');

    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, propertyId, propertyTitle, ownerId }),
      });

      if (!res.ok) throw new Error('Error');
      setStatus('success');
      setFormData({ name: '', email: '', phone: '', message: '' });
      setTimeout(() => setStatus('idle'), 3000);
    } catch {
      setStatus('error');
      setTimeout(() => setStatus('idle'), 3000);
    }
  };

  if (status === 'success') {
    return (
      <div className="bg-success/10 border border-success/20 rounded-2xl p-4 text-center">
        <Check className="w-8 h-8 text-success mx-auto mb-2" />
        <p className="text-sm font-bold text-success">¡Solicitud enviada!</p>
        <p className="text-xs text-muted-foreground mt-1">El arrendador se pondrá en contacto contigo.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">¿Te interesa?</h3>
      <p className="text-[10px] text-muted-foreground">Déjanos tus datos y el arrendador te contactará.</p>

      <input
        type="text"
        placeholder="Nombre completo"
        required
        value={formData.name}
        onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
        className="w-full px-3.5 py-2.5 bg-muted/50 border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
      />
      <input
        type="email"
        placeholder="Correo electrónico"
        required
        value={formData.email}
        onChange={(e) => setFormData(p => ({ ...p, email: e.target.value }))}
        className="w-full px-3.5 py-2.5 bg-muted/50 border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
      />
      <input
        type="tel"
        placeholder="Teléfono"
        required
        value={formData.phone}
        onChange={(e) => setFormData(p => ({ ...p, phone: e.target.value }))}
        className="w-full px-3.5 py-2.5 bg-muted/50 border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
      />
      <textarea
        placeholder="Mensaje (opcional)"
        rows={3}
        value={formData.message}
        onChange={(e) => setFormData(p => ({ ...p, message: e.target.value }))}
        className="w-full px-3.5 py-2.5 bg-muted/50 border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all resize-none"
      />

      <button
        type="submit"
        disabled={status === 'loading'}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary hover:bg-primary-hover text-primary-foreground font-bold rounded-xl text-sm transition-all disabled:opacity-50 cursor-pointer border-none"
      >
        {status === 'loading' ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Send className="w-4 h-4" />
        )}
        {status === 'loading' ? 'Enviando...' : 'Solicitar información'}
      </button>

      {status === 'error' && (
        <p className="text-xs text-destructive text-center">Error al enviar. Intenta de nuevo.</p>
      )}
    </form>
  );
}