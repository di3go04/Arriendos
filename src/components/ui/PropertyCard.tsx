'use client';

import { useInView } from '@/hooks/useInView';
import { motion,useReducedMotion } from 'framer-motion';

interface PropertyCardProps {
  title: string;
  address: string;
  monthlyRent: number;
  rooms: number;
  status: 'disponible' | 'arrendada' | 'mantenimiento';
  image?: string;
  index?: number;
}

const statusStyles: Record<string, string> = {
  disponible: 'bg-[#4d7c0f]/10 text-[#4d7c0f] border-[#4d7c0f]/20',
  arrendada: 'bg-[#2563EB]/10 text-[#2563EB] border-[#2563EB]/20',
  mantenimiento: 'bg-[#D97706]/10 text-[#D97706] border-[#D97706]/20',
};

const statusLabels: Record<string, string> = {
  disponible: 'Disponible',
  arrendada: 'Arrendada',
  mantenimiento: 'Mantenimiento',
};

export function PropertyCard({ title, address, monthlyRent, rooms, status, image, index = 0 }: PropertyCardProps) {
  const [ref, inView] = useInView<HTMLDivElement>({ threshold: 0.1 });
  const reduce = useReducedMotion();

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(val);

  return (
    <motion.div
      ref={ref}
      initial={reduce ? { opacity: 1 } : { opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: reduce ? 1 : 0, y: reduce ? 0 : 20 }}
      transition={{ duration: 0.35, delay: reduce ? 0 : index * 0.06, ease: 'easeOut' }}
      className="bg-white rounded-[16px] shadow-[0_1px_2px_rgba(0,0,0,0.04),0_2px_4px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_25px_rgba(0,0,0,0.08),0_2px_8px_rgba(0,0,0,0.04)] hover:scale-[1.02] transition-all duration-200 overflow-hidden group"
    >
      {image ? (
        <img src={image} alt={title} className="w-full h-40 object-cover transition-transform duration-300 group-hover:scale-105" />
      ) : (
        <div className="w-full h-40 bg-gradient-to-br from-[#1E3A5F] via-[#2E4A7A] to-[#2563EB] flex items-center justify-center">
          <span className="text-4xl opacity-30">🏠</span>
        </div>
      )}

      <div className="p-5 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-bold text-[#1A202C] text-sm truncate" style={{ fontFamily: 'Poppins, sans-serif' }}>
            {title}
          </h3>
          <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusStyles[status] || ''}`}>
            {statusLabels[status] || status}
          </span>
        </div>

        <p className="text-xs text-[#64748B] flex items-center gap-1">
          <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {address}
        </p>

        <div className="flex items-center justify-between pt-2 border-t border-[#EDF2F7]">
          <div>
            <p className="text-[10px] text-[#94A3B8] font-medium uppercase tracking-wider">Canon</p>
            <p className="text-sm font-bold text-[#1A202C] tabular-nums">{formatCurrency(monthlyRent)}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-[#94A3B8] font-medium uppercase tracking-wider">Habitaciones</p>
            <p className="text-sm font-bold text-[#1A202C]">{rooms}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
