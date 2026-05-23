'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Home, Search, ArrowLeft, HelpCircle, Compass, Sparkles } from 'lucide-react';

export default function NotFound() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/properties?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-white relative overflow-hidden px-4">
      {/* Dynamic background lights */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl -z-10 animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-brand-light/10 rounded-full blur-3xl -z-10 animate-pulse" style={{ animationDelay: '2s' }} />

      <div className="text-center max-w-lg w-full space-y-8 z-10">
        {/* Floaty 404 Logo */}
        <div className="relative">
          <motion.div
            initial={{ y: 0 }}
            animate={{ y: [-15, 15, -15] }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="text-8xl md:text-9xl font-extrabold tracking-widest bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-500 bg-clip-text text-transparent drop-shadow-xl select-none"
            style={{ fontFamily: 'Poppins, sans-serif' }}
          >
            404
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="absolute -top-4 right-1/4 p-2 bg-indigo-600 rounded-2xl shadow-lg border border-indigo-400/30 flex items-center gap-1.5 text-xs font-bold"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-200" />
            ¡Vaya! Perdido en el espacio
          </motion.div>
        </div>

        {/* Text */}
        <div className="space-y-3">
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight" style={{ fontFamily: 'Poppins, sans-serif' }}>
            La propiedad no está en el mapa
          </h1>
          <p className="text-sm text-slate-400 max-w-sm mx-auto leading-relaxed">
            La página o inmueble que estás buscando ha cambiado de dirección o ha sido retirada del mercado.
          </p>
        </div>

        {/* Interactive Search Bar */}
        <motion.form
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          onSubmit={handleSearch}
          className="relative max-w-md mx-auto"
        >
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="¿Qué propiedad buscas? Ej. Apartamento en Bogotá..."
            className="w-full pl-12 pr-28 py-4 bg-slate-900/90 border border-slate-800 rounded-2xl text-sm font-semibold text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-lg shadow-black/40"
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold rounded-xl transition-all shadow-md cursor-pointer border-none"
          >
            Buscar
          </button>
        </motion.form>

        {/* Helpful quick links */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs"
        >
          {[
            { href: '/dashboard', label: 'Dashboard', icon: Home },
            { href: '/properties', label: 'Propiedades', icon: Compass },
            { href: '/blog', label: 'Blog & Guías', icon: Sparkles },
            { href: '/status', label: 'Estado', icon: HelpCircle },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center gap-2 p-3 bg-slate-900/40 border border-slate-800/80 rounded-2xl hover:bg-slate-900 hover:border-slate-700 transition-all group"
            >
              <item.icon className="w-5 h-5 text-slate-400 group-hover:text-indigo-400 transition-colors" />
              <span className="text-[10px] font-bold text-slate-300 tracking-wide">{item.label}</span>
            </Link>
          ))}
        </motion.div>

        {/* Retorno manual */}
        <div className="pt-4">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 px-6 py-3 bg-transparent hover:bg-slate-900 text-slate-300 hover:text-white text-xs font-bold rounded-2xl border border-slate-800 hover:border-slate-700 transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver a la página anterior
          </button>
        </div>
      </div>
    </div>
  );
}
