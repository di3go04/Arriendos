'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, TrendingUp } from 'lucide-react';

interface ValuationCalculatorProps {
  initialScore?: number;
}

export default function ValuationCalculator({ initialScore = 75 }: ValuationCalculatorProps) {
  // Sliders State
  const [arr, setArr] = useState(15000); // ARR in USD
  const [morosity, setMorosity] = useState(4); // % Morosity
  const [score, setScore] = useState(initialScore); // % Checklist Score
  const [tenants, setTenants] = useState(45); // Active tenants

  // Valuation Outputs
  const [multiplier, setMultiplier] = useState(4.5);
  const [saasValuation, setSaasValuation] = useState(0);
  const [codebaseValue, setCodebaseValue] = useState(12000); // Base assets value
  const [totalValuation, setTotalValuation] = useState(0);

  useEffect(() => {
    // Calculate Multiplier based on sliders
    let mult = 4.5; // Base SaaS multiplier

    // 1. Morosity Impact
    if (morosity <= 2) {
      mult += 0.8; // Low churn/morosity premium
    } else if (morosity > 12) {
      mult -= 1.8; // High risk discount
    } else if (morosity > 6) {
      mult -= 0.8;
    }

    // 2. Checklist Readiness Score Impact
    if (score >= 90) {
      mult += 1.2; // Premium code quality & security audit trail premium
    } else if (score < 50) {
      mult -= 1.5; // Underdeveloped technical debt discount
    } else if (score < 75) {
      mult -= 0.5;
    }

    // 3. Scale of Tenant base
    if (tenants >= 150) {
      mult += 0.5;
    } else if (tenants < 10) {
      mult -= 0.5;
    }

    // Boundary constraint
    mult = Math.max(1.5, Math.min(10, mult));
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMultiplier(mult);

    // Calculate valuations
    const saasVal = arr * mult;
    setSaasValuation(saasVal);

    // Codebase assets value adjusts with readiness checklist score
    const codebaseVal = 8000 + (score / 100) * 4000;
    setCodebaseValue(codebaseVal);

    setTotalValuation(saasVal + codebaseVal);
  }, [arr, morosity, score, tenants]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 text-white space-y-8 shadow-xl">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-2xl shadow-md text-white">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-extrabold text-lg leading-tight text-white flex items-center gap-2">
              Simulador de Valoración de Venta SaaS
              <span className="bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Premium Tool</span>
            </h3>
            <p className="text-xs text-slate-400 font-semibold mt-0.5">Calcula el valor de mercado total de RentNow al vender el negocio o su código fuente</p>
          </div>
        </div>

        {/* Display Total Valuation */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl px-5 py-3 text-right">
          <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Valor Estimado de Venta</span>
          <span className="block text-2xl font-extrabold text-indigo-400 tabular-nums">
            USD ${(Math.round(totalValuation)).toLocaleString()}
          </span>
        </div>
      </div>

      {/* Sliders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Left Side Sliders */}
        <div className="space-y-6">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Métricas de Negocio</h4>
          
          {/* Sliders ARR */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-300">ARR (Ingreso Recurrente Anual)</span>
              <span className="text-white font-bold tabular-nums">USD ${(arr).toLocaleString()}</span>
            </div>
            <input
              type="range"
              min="0"
              max="150000"
              step="2500"
              value={arr}
              onChange={(e) => setArr(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
            <div className="flex justify-between text-[9px] text-slate-500">
              <span>$0 USD</span>
              <span>$75K USD</span>
              <span>$150K USD</span>
            </div>
          </div>

          {/* Slider Inquilinos */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-300">Inquilinos Activos Suscritos</span>
              <span className="text-white font-bold tabular-nums">{tenants} inquilinos</span>
            </div>
            <input
              type="range"
              min="0"
              max="300"
              step="5"
              value={tenants}
              onChange={(e) => setTenants(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
            <div className="flex justify-between text-[9px] text-slate-500">
              <span>0</span>
              <span>150 inquilinos</span>
              <span>300</span>
            </div>
          </div>
        </div>

        {/* Right Side Sliders */}
        <div className="space-y-6">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Métricas de Calidad y Riesgo</h4>

          {/* Slider Morosidad */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-300">Tasa de Incumplimiento/Morosidad</span>
              <span className={`font-bold tabular-nums ${morosity > 10 ? 'text-red-400' : 'text-emerald-400'}`}>
                {morosity}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="30"
              step="0.5"
              value={morosity}
              onChange={(e) => setMorosity(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
            <div className="flex justify-between text-[9px] text-slate-500">
              <span>0% (Perfecto)</span>
              <span>15%</span>
              <span>30% (Alto Riesgo)</span>
            </div>
          </div>

          {/* Slider Readiness Score */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-300">Checklist de Preparación Tecnológica</span>
              <span className="text-white font-bold tabular-nums">{score}% completado</span>
            </div>
            <input
              type="range"
              min="20"
              max="100"
              step="1"
              value={score}
              onChange={(e) => setScore(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
            <div className="flex justify-between text-[9px] text-slate-500">
              <span>20% (Básico)</span>
              <span>60%</span>
              <span>100% (Listo para producción)</span>
            </div>
          </div>
        </div>

      </div>

      {/* Breakdown results */}
      <div className="bg-slate-950 rounded-2xl p-5 border border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Metric 1 */}
        <div className="space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Multiplicador SaaS Aplicado</span>
          <span className="text-xl font-bold text-indigo-400 flex items-center gap-1.5">
            {multiplier.toFixed(2)}x
            <span className="text-[10px] text-slate-500 font-semibold font-sans">basado en riesgo</span>
          </span>
          <p className="text-[10px] text-slate-500 leading-normal">
            Calculado dinámicamente según la tasa de morosidad e integración de firma y seguridad.
          </p>
        </div>

        {/* Metric 2 */}
        <div className="space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Valor Recurrencia SaaS</span>
          <span className="text-xl font-bold text-white tabular-nums">
            USD ${(Math.round(saasValuation)).toLocaleString()}
          </span>
          <p className="text-[10px] text-slate-500 leading-normal">
            Basado en tus ingresos recurrentes por suscripciones anuales (ARR) multiplicados.
          </p>
        </div>

        {/* Metric 3 */}
        <div className="space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Valor de Activos de Código</span>
          <span className="text-xl font-bold text-white tabular-nums">
            USD ${(Math.round(codebaseValue)).toLocaleString()}
          </span>
          <p className="text-[10px] text-slate-500 leading-normal">
            Valor base del código fuente (USD $6,000) + hasta +$7,700 con las 9 mejoras modulares premium activas.
          </p>
        </div>

      </div>

      {/* Checklist banner */}
      <div className="p-4 bg-indigo-600/10 border border-indigo-600/20 rounded-2xl flex items-start gap-3">
        <Sparkles className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
        <div>
          <h5 className="text-xs font-bold text-indigo-300">¿Cómo incrementar el valor de venta final?</h5>
          <p className="text-[10px] text-slate-400 leading-relaxed mt-0.5">
            Asegura tener un checklist de preparación por encima del 90% aplicando las 9 mejoras modulares del sistema RentNow. Esto aumenta el multiplicador SaaS hasta en un <strong>+1.2x</strong>, reduciendo la morosidad mediante automatizaciones de pasarela de pago y firma criptográfica.
          </p>
        </div>
      </div>
    </div>
  );
}
