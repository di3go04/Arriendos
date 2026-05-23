"use client";

import { Check, CreditCard, Loader2 } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/components/ui/Toast";

const PLANS = [
  { id: "basic", name: "Básico", price: 29, period: "/mes", features: ["1 propiedad", "Reportes básicos", "Soporte email"] },
  { id: "pro", name: "Pro", price: 59, period: "/mes", features: ["10 propiedades", "Reportes avanzados", "Soporte prioritario", "API access"] },
  { id: "enterprise", name: "Enterprise", price: 99, period: "/mes", features: ["Ilimitado", "White-label", "Soporte 24/7", "SSO", "Auditoría"] },
];

export function PaymentSimulation() {
  const [selectedPlan, setSelectedPlan] = useState("pro");
  const [loading, setLoading] = useState(false);
  const [paid, setPaid] = useState(false);
  const { toast } = useToast();

  const handlePayment = async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 2000));
    setLoading(false);
    setPaid(true);
    const plan = PLANS.find((p) => p.id === selectedPlan);
    toast({
      type: "success",
      message: `Pago simulado de $${plan?.price} USD procesado con éxito (Stripe)`,
    });
  };

  return (
    <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <CreditCard className="w-4 h-4 text-[#1e3a5f]" />
        <h3 className="text-xs font-bold text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider">
          Simulación de pago
        </h3>
      </div>
      <p className="text-[10px] text-[#94A3B8] mb-4 leading-relaxed">
        Seleccioná un plan y probá el flujo de checkout simulado con Stripe.
      </p>

      <div className="space-y-2 mb-4">
        {PLANS.map((plan) => (
          <button
            key={plan.id}
            type="button"
            onClick={() => { setSelectedPlan(plan.id); setPaid(false); }}
            className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all cursor-pointer ${
              selectedPlan === plan.id
                ? "border-[#1e3a5f] bg-[#1e3a5f]/5 dark:bg-[#1e3a5f]/10"
                : "border-gray-200 dark:border-gray-600 hover:border-gray-300"
            }`}
          >
            <div>
              <p className="text-sm font-bold text-[#1E293B] dark:text-white">{plan.name}</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {plan.features.map((f) => (
                  <span key={f} className="text-[9px] px-1.5 py-0.5 rounded-md bg-gray-100 dark:bg-gray-700 text-[#64748B] dark:text-[#94A3B8]">
                    {f}
                  </span>
                ))}
              </div>
            </div>
            <div className="text-right shrink-0 ml-3">
              <p className="text-lg font-black text-[#1E293B] dark:text-white">${plan.price}</p>
              <p className="text-[9px] text-[#94A3B8]">{plan.period}</p>
            </div>
          </button>
        ))}
      </div>

      {paid ? (
        <div className="flex items-center gap-2 py-3 px-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
          <Check className="w-4 h-4 text-emerald-600" />
          <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
            Pago completado — ¡Gracias por tu simulación!
          </span>
        </div>
      ) : (
        <button
          type="button"
          onClick={handlePayment}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-bold rounded-xl bg-[#1e3a5f] text-white hover:bg-[#152e4a] transition-all disabled:opacity-50 cursor-pointer active:scale-[0.98] shadow-lg shadow-[#1e3a5f]/20"
        >
          {loading ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Procesando pago...</>
          ) : (
            <><CreditCard className="w-4 h-4" /> Pagar ${PLANS.find((p) => p.id === selectedPlan)?.price} USD</>
          )}
        </button>
      )}
    </div>
  );
}
