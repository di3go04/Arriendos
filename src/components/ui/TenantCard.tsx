'use client';

interface TenantCardProps {
  name: string;
  document: string;
  phone: string;
  property: string;
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

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function TenantCard({ name, document, phone, property, status }: TenantCardProps) {
  return (
    <div className="bg-white rounded-[16px] shadow-[0_1px_2px_rgba(0,0,0,0.04),0_2px_4px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_25px_rgba(0,0,0,0.08),0_2px_8px_rgba(0,0,0,0.04)] hover:scale-[1.02] transition-all duration-200 p-5">
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#1E3A5F] to-[#2563EB] flex items-center justify-center text-white text-sm font-bold shrink-0 shadow-[0_2px_8px_rgba(30,58,95,0.15)]">
          {getInitials(name)}
        </div>

        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-bold text-[#1A202C] text-sm truncate" style={{ fontFamily: 'Poppins, sans-serif' }}>
              {name}
            </h3>
            <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusStyles[status] || ''}`}>
              {statusLabels[status] || status}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs text-[#64748B]">
            <div>
              <span className="text-[10px] text-[#94A3B8] font-medium uppercase tracking-wider block">Documento</span>
              <span className="font-medium text-[#1A202C]">{document}</span>
            </div>
            <div>
              <span className="text-[10px] text-[#94A3B8] font-medium uppercase tracking-wider block">Teléfono</span>
              <span className="font-medium text-[#1A202C]">{phone}</span>
            </div>
          </div>

          <div className="pt-2 border-t border-[#EDF2F7]">
            <span className="text-[10px] text-[#94A3B8] font-medium uppercase tracking-wider block">Propiedad</span>
            <span className="text-xs font-semibold text-[#1A202C]">{property}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
