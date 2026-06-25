'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Home, Search, ArrowLeft, HelpCircle, Compass, Sparkles } from 'lucide-react';

export default function NotFound() {
  const router = useRouter();
  const t = useTranslations('not_found');
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/properties?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground relative overflow-hidden px-4">
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
            className="text-8xl md:text-9xl font-extrabold tracking-widest bg-gradient-to-r from-primary via-brand to-purple-500 bg-clip-text text-transparent drop-shadow-xl select-none"
            style={{ fontFamily: 'Poppins, sans-serif' }}
          >
            404
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="absolute -top-4 right-1/4 p-2 bg-primary rounded-2xl shadow-lg border border-primary/30 flex items-center gap-1.5 text-xs font-bold"
          >
            <Sparkles className="w-3.5 h-3.5 text-primary-foreground/80" />
            {t('badge')}
          </motion.div>
        </div>

        {/* Text */}
        <div className="space-y-3">
          <h1 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight" style={{ fontFamily: 'Poppins, sans-serif' }}>
            {t('heading')}
          </h1>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
            {t('description')}
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
            placeholder={t('search_placeholder')}
            className="w-full pl-12 pr-28 py-4 bg-card/90 border border-border rounded-2xl text-sm font-semibold text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all duration-300 shadow-card"
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-extrabold rounded-xl transition-all duration-300 shadow-md cursor-pointer border-none"
          >
            {t('search_button')}
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
            {href: '/dashboard', label: t('quick_dashboard'), icon: Home },
            { href: '/properties', label: t('quick_properties'), icon: Compass },
            { href: '/blog', label: t('quick_blog'), icon: Sparkles },
            { href: '/status', label: t('quick_status'), icon: HelpCircle },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center gap-2 p-3 bg-card/40 border border-border/80 rounded-2xl hover:bg-muted hover:border-border transition-all duration-300 group"
            >
              <item.icon className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
              <span className="text-[10px] font-bold text-muted-foreground tracking-wide">{item.label}</span>
            </Link>
          ))}
        </motion.div>

        {/* Retorno manual */}
        <div className="pt-4">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 px-6 py-3 bg-transparent hover:bg-muted text-muted-foreground hover:text-foreground text-xs font-bold rounded-2xl border border-border hover:border-border transition-all duration-300 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
                        {t('back_button')}
          </button>
        </div>
      </div>
    </div>
  );
}
