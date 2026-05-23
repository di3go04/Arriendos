'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { motion } from 'framer-motion';
import { Building2, CreditCard, FileText, Check, ArrowRight } from 'lucide-react';

const steps = [
  { icon: Building2, title: 'Crea tu primera propiedad', desc: 'Agrega los datos de tu inmueble y comienza a gestionarlo.' },
  { icon: FileText, title: 'Genera un contrato', desc: 'Usa nuestras plantillas inteligentes con IA.' },
  { icon: CreditCard, title: 'Recibe pagos', desc: 'Configura Mercado Pago para cobrar la renta.' },
];

export default function OnboardingPage() {
  const [current, setCurrent] = useState(0);
  const router = useRouter();
  const { profile } = useAuth();

  const handleComplete = () => {
    if (profile?.role === 'arrendador') router.push('/dashboard/landlord');
    else router.push('/dashboard/tenant');
  };

  const step = steps[current];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] to-[#e6edf5] flex items-center justify-center p-6">
      <motion.div
        key={current}
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md bg-white rounded-card shadow-card p-8 text-center"
      >
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#1e3a5f]/10 text-[#1e3a5f] mb-6">
          <step.icon className="w-8 h-8" />
        </div>
        <h1 className="text-xl font-bold text-foreground mb-2">{step.title}</h1>
        <p className="text-sm text-muted-foreground mb-8">{step.desc}</p>

        <div className="flex justify-center gap-2 mb-8">
          {steps.map((_, i) => (
            <div key={i} className={`w-2 h-2 rounded-full transition-colors ${i === current ? 'bg-[#1e3a5f] w-6' : 'bg-muted'}`} />
          ))}
        </div>

        {current < steps.length - 1 ? (
          <button
            onClick={() => setCurrent(c => c + 1)}
            className="w-full flex items-center justify-center gap-2 py-3 bg-[#1e3a5f] hover:bg-[#152e4a] text-white font-bold rounded-xl transition-all cursor-pointer border-none"
          >
            Siguiente <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={handleComplete}
            className="w-full flex items-center justify-center gap-2 py-3 bg-[#f59e0b] hover:bg-[#d97706] text-[#1e3a5f] font-bold rounded-xl transition-all cursor-pointer border-none"
          >
            <Check className="w-4 h-4" /> Comenzar
          </button>
        )}
      </motion.div>
    </div>
  );
}
