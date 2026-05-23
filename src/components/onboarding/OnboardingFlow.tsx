'use client';

import { ArrowLeft,ArrowRight,Building,Check,ChevronRight,FileText,Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

const steps = [
  {
    id: 'welcome',
    title: '¡Bienvenido a RentNow!',
    description: 'Te guiaremos paso a paso para que configures tu primera propiedad.',
    icon: Building,
  },
  {
    id: 'property',
    title: '1. Crea tu primera propiedad',
    description: 'Registra los datos básicos del inmueble que deseas administrar.',
    icon: Building,
    fields: [
      { name: 'title', label: 'Nombre de la propiedad', placeholder: 'Ej: Apartamento 301', type: 'text' },
      { name: 'type', label: 'Tipo de inmueble', type: 'select', options: ['casa', 'apartamento', 'local', 'oficina', 'terreno'] },
      { name: 'address', label: 'Dirección', placeholder: 'Ej: Calle 123 #45-67', type: 'text' },
      { name: 'city', label: 'Ciudad', placeholder: 'Ej: Bogotá', type: 'text' },
      { name: 'monthly_rent', label: 'Canon de arrendamiento ($)', placeholder: 'Ej: 1200000', type: 'number' },
    ],
  },
  {
    id: 'tenant',
    title: '2. Agrega un inquilino',
    description: 'Ingresa los datos de la persona que arrendará la propiedad.',
    icon: Users,
    fields: [
      { name: 'full_name', label: 'Nombre completo', placeholder: 'Ej: María González', type: 'text' },
      { name: 'email', label: 'Correo electrónico', placeholder: 'ejemplo@correo.com', type: 'email' },
      { name: 'phone', label: 'Teléfono', placeholder: 'Ej: 300 111 2233', type: 'tel' },
    ],
  },
  {
    id: 'contract',
    title: '3. Firma digital del contrato',
    description: 'Genera y envía el contrato de arrendamiento para firma digital.',
    icon: FileText,
    fields: [
      { name: 'start_date', label: 'Fecha de inicio', type: 'date' },
      { name: 'end_date', label: 'Fecha de finalización', type: 'date' },
      { name: 'payment_day', label: 'Día de pago', type: 'number', placeholder: 'Ej: 5' },
    ],
  },
  {
    id: 'complete',
    title: '¡Todo listo!',
    description: 'Has configurado tu primer arriendo. Ahora puedes explorar el dashboard.',
    icon: Check,
  },
];

export default function OnboardingFlow() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<Record<string, LooseValue>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const step = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;

  const updateField = (name: string, value: LooseValue) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleNext = async () => {
    if (currentStep === steps.length - 2) {
      // Submit onboarding
      setLoading(true);
      setError('');

      try {
        const res = await fetch('/api/onboarding/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Error al completar onboarding');
        }

        setCurrentStep(currentStep + 1);
      } catch (err: unknown) {
        setError((err as { message?: string }).message || 'Error al completar el onboarding');
      } finally {
        setLoading(false);
      }
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleFinish = () => {
    router.push('/dashboard');
    router.refresh();
  };

  const progressPercent = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="min-h-screen bg-[#F4F6F9] flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex justify-between text-xs font-semibold text-muted-foreground mb-2">
            <span>Progreso</span>
            <span>{Math.round(progressPercent)}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Step indicator */}
        <div className="flex justify-between mb-8">
          {steps.map((s, i) => (
            <div key={s.id} className="flex flex-col items-center gap-1.5">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                i <= currentStep
                  ? 'bg-primary text-primary-foreground shadow-btn'
                  : 'bg-muted text-muted-foreground'
              }`}>
                {i < currentStep ? <Check className="w-5 h-5" /> : i + 1}
              </div>
              <span className={`text-[10px] font-semibold text-center max-w-[80px] ${
                i <= currentStep ? 'text-foreground' : 'text-muted-foreground'
              }`}>
                {i === 0 ? 'Bienvenido' : s.title.split('.')[1]?.trim() || s.title}
              </span>
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="bg-card border border-border/50 rounded-3xl p-8 shadow-card">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 rounded-2xl bg-primary/10 border border-primary/20">
              <step.icon className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-black text-foreground">{step.title}</h2>
              <p className="text-sm text-muted-foreground">{step.description}</p>
            </div>
          </div>

          {/* Fields */}
          {'fields' in step && step.fields && (
            <div className="space-y-4 mt-6">
              {step.fields.map((field: LooseValue) => (
                <div key={field.name}>
                  <label className="text-xs font-bold text-foreground block mb-1.5">
                    {field.label}
                  </label>
                  {field.type === 'select' ? (
                    <select
                      value={formData[field.name] || ''}
                      onChange={(e) => updateField(field.name, e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-muted/50 border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                    >
                      <option value="">Seleccionar...</option>
                      {field.options.map((opt: string) => (
                        <option key={opt} value={opt}>{opt.charAt(0).toUpperCase() + opt.slice(1)}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={field.type}
                      placeholder={field.placeholder}
                      value={formData[field.name] || ''}
                      onChange={(e) => updateField(field.name, e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-muted/50 border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          {error && (
            <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-xl text-xs text-destructive font-semibold">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-border/50">
            <button
              onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
              disabled={isFirstStep}
              className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors disabled:opacity-30 cursor-pointer border-none bg-transparent"
            >
              <ArrowLeft className="w-4 h-4" /> Anterior
            </button>

            {isLastStep ? (
              <button
                onClick={handleFinish}
                className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary-hover text-primary-foreground font-bold rounded-xl text-sm transition-all shadow-btn hover:shadow-btn-hover cursor-pointer border-none"
              >
                Ir al Dashboard <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleNext}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary-hover text-primary-foreground font-bold rounded-xl text-sm transition-all shadow-btn hover:shadow-btn-hover disabled:opacity-50 cursor-pointer border-none"
              >
                {loading ? 'Guardando...' : isFirstStep ? 'Comenzar' : 'Siguiente'}
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}