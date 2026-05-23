'use client';

interface Rental {
  id: string;
  address: string;
  tenant: string;
  startDate: string;
  endDate: string;
  monthlyRent: number;
  status: 'activo' | 'mora' | 'finalizado';
}

const statusStyles: Record<string, string> = {
  activo: 'bg-[#4d7c0f]/10 text-[#4d7c0f] border-[#4d7c0f]/20',
  mora: 'bg-[#D97706]/10 text-[#D97706] border-[#D97706]/20',
  finalizado: 'bg-[#E2E8F0] text-[#94A3B8] border-[#E2E8F0]',
};

const statusLabels: Record<string, string> = {
  activo: 'Activo',
  mora: 'En Mora',
  finalizado: 'Finalizado',
};

import { formatCOP,formatDate } from '@/lib/format';

export function RentalsList({ rentals }: { rentals: Rental[] }) {
  if (rentals.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-[16px] shadow-[0_1px_2px_rgba(0,0,0,0.04),0_2px_4px_rgba(0,0,0,0.04)]">
        <span className="text-4xl block mb-4">📋</span>
        <p className="font-bold text-[#1A202C] text-sm">No hay arriendos registrados</p>
        <p className="text-xs text-[#94A3B8] mt-1">Crea tu primer contrato para verlo aquí.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
      {rentals.map((r) => (
        <div
          key={r.id}
          className="bg-white rounded-[16px] shadow-[0_1px_2px_rgba(0,0,0,0.04),0_2px_4px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_25px_rgba(0,0,0,0.08),0_2px_8px_rgba(0,0,0,0.04)] hover:scale-[1.02] transition-all duration-200 p-5 space-y-4"
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-bold text-[#1A202C] text-sm" style={{ fontFamily: 'Poppins, sans-serif' }}>
                {r.address}
              </h3>
              <p className="text-xs text-[#64748B] mt-0.5">{r.tenant}</p>
            </div>
            <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusStyles[r.status] || ''}`}>
              {statusLabels[r.status] || r.status}
            </span>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-[#F8FAFC] rounded-lg p-2.5">
              <span className="text-[10px] text-[#94A3B8] font-medium">Inicio</span>
              <p className="font-semibold text-[#1A202C]">{formatDate(r.startDate)}</p>
            </div>
            <div className="bg-[#F8FAFC] rounded-lg p-2.5">
              <span className="text-[10px] text-[#94A3B8] font-medium">Fin</span>
              <p className="font-semibold text-[#1A202C]">{formatDate(r.endDate)}</p>
            </div>
          </div>

          {/* Rent */}
          <div className="flex items-center justify-between pt-3 border-t border-[#EDF2F7]">
            <span className="text-[10px] text-[#94A3B8] font-medium uppercase tracking-wider">Canon mensual</span>
            <span className="font-bold text-[#1A202C] tabular-nums">{formatCOP(r.monthlyRent)}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
