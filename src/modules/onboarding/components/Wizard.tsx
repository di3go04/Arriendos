"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronLeft, ChevronRight, Loader2, User, Settings, Rocket } from "lucide-react";
import { sendWelcomeEmail } from "./WelcomeEmail";

const STEPS = [
  { id: 1, label: "Perfil", icon: User },
  { id: 2, label: "Preferencias", icon: Settings },
  { id: 3, label: "Listo", icon: Rocket },
];

export const Wizard = ({ onComplete }: { onComplete?: () => void }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const next = () => setStep((s) => Math.min(s + 1, 3));
  const back = () => setStep((s) => Math.max(s - 1, 1));

  const finish = async () => {
    setLoading(true);
    try {
      await sendWelcomeEmail();
      if (onComplete) {
        onComplete();
      } else {
        router.push("/dashboard");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-8">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const isActive = step === s.id;
          const isDone = step > s.id;
          return (
            <div key={s.id} className="flex items-center gap-2">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                  isDone
                    ? "bg-emerald-500 text-white"
                    : isActive
                    ? "bg-[#1e3a5f] text-white ring-4 ring-[#1e3a5f]/20"
                    : "bg-gray-200 dark:bg-gray-700 text-gray-400"
                }`}
              >
                {isDone ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
              </div>
              <span
                className={`hidden sm:block text-xs font-semibold ${
                  isActive
                    ? "text-[#1e3a5f] dark:text-white"
                    : isDone
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-gray-400"
                }`}
              >
                {s.label}
              </span>
              {i < STEPS.length - 1 && (
                <div
                  className={`hidden sm:block w-12 h-0.5 mx-1 rounded-full ${
                    isDone ? "bg-emerald-400" : "bg-gray-300 dark:bg-gray-600"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>

      <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm min-h-[200px]">
        {step === 1 && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-[#1E293B] dark:text-white">Paso 1: Tu perfil</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Cuéntanos sobre ti para personalizar tu experiencia.
            </p>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Nombre completo"
                className="w-full bg-gray-50 dark:bg-[#0F172A] border border-gray-200 dark:border-gray-600 text-sm rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#1e3a5f]/20"
              />
              <input
                type="text"
                placeholder="Teléfono"
                className="w-full bg-gray-50 dark:bg-[#0F172A] border border-gray-200 dark:border-gray-600 text-sm rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#1e3a5f]/20"
              />
            </div>
          </div>
        )}
        {step === 2 && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-[#1E293B] dark:text-white">Paso 2: Preferencias</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Configura tus preferencias de notificación y facturación.
            </p>
            <div className="space-y-3">
              {["Notificaciones por email", "Recordatorio de pagos", "Informes semanales"].map(
                (item) => (
                  <label
                    key={item}
                    className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 dark:border-gray-600 cursor-pointer hover:bg-gray-50 dark:hover:bg-[#0F172A] transition-colors"
                  >
                    <input
                      type="checkbox"
                      defaultChecked
                      className="w-4 h-4 rounded accent-[#1e3a5f]"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{item}</span>
                  </label>
                )
              )}
            </div>
          </div>
        )}
        {step === 3 && (
          <div className="space-y-4 text-center py-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <Rocket className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h3 className="text-lg font-bold text-[#1E293B] dark:text-white">¡Todo listo!</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Presiona "Finalizar" para completar la configuración y recibir un email de bienvenida.
            </p>
          </div>
        )}
      </div>

      <div className="flex justify-between mt-6">
        <button
          onClick={back}
          disabled={step === 1}
          className="flex items-center gap-1.5 px-5 py-2.5 text-sm font-semibold rounded-xl border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1E293B] transition-colors disabled:opacity-30 cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" /> Anterior
        </button>

        {step < 3 ? (
          <button
            onClick={next}
            className="flex items-center gap-1.5 px-5 py-2.5 text-sm font-semibold rounded-xl bg-[#1e3a5f] text-white hover:bg-[#152e4a] transition-colors shadow-lg shadow-[#1e3a5f]/20 cursor-pointer"
          >
            Siguiente <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={finish}
            disabled={loading}
            className="flex items-center gap-1.5 px-6 py-2.5 text-sm font-semibold rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-600/20 disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Finalizando...</>
            ) : (
              <>
                Finalizar <Rocket className="w-4 h-4" />
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};
