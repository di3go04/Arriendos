'use client';

import { useInView } from '@/hooks/useInView';
import { useLocale, useTranslations } from 'next-intl';
import { motion, useReducedMotion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';

const faqKeys = ['q1', 'q2', 'q3', 'q4', 'q5', 'q6'] as const;

function AccordionItem({ question, answer, index, inView }: { question: string; answer: string; index: number; inView: boolean }) {
    const [isOpen, setIsOpen] = useState(false);
    const reduce = useReducedMotion();

    return (
        <motion.div
            initial={reduce ? { opacity: 1 } : { opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.4, delay: reduce ? 0 : index * 0.08, ease: 'easeOut' }}
            className="group border-b border-[#e6edf5] last:border-b-0"
        >
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between gap-4 py-5 px-6 text-left transition-all duration-200 hover:bg-[#f8fafc]/80 rounded-lg"
                aria-expanded={isOpen}
                aria-controls={`faq-answer-${index}`}
            >
                <span className="font-semibold text-[#1e293b] text-sm md:text-base leading-relaxed flex-1">
                    {question}
                </span>
                <ChevronDown
                    className={`w-5 h-5 text-[#64748b] shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''
                        }`}
                />
            </button>
            <div
                id={`faq-answer-${index}`}
                role="region"
                className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                    }`}
            >
                <p className="px-6 pb-5 text-sm text-[#64748b] leading-relaxed">
                    {answer}
                </p>
            </div>
        </motion.div>
    );
}

export function FAQSection() {
    const [ref, inView] = useInView<HTMLDivElement>({ threshold: 0.05, once: true });
    const t = useTranslations('faq');
    const locale = useLocale();

    return (
        <section ref={ref} id="faq" className="relative py-20 md:py-28 bg-white">
            <div className="absolute inset-0 bg-gradient-to-b from-[#f8fafc] to-transparent pointer-events-none" />
            <div className="relative mx-auto max-w-7xl px-5 md:px-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={inView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.5 }}
                    className="text-center max-w-2xl mx-auto mb-14"
                >
                    <span className="text-xs font-bold text-[#f59e0b] uppercase tracking-[0.2em]">
                        {t('badge')}
                    </span>
                    <h2 className="font-display font-bold text-[#1e3a5f] text-3xl md:text-4xl lg:text-5xl leading-tight tracking-tight mt-3 mb-4">
                        {t('title')}<span className="text-[#f59e0b]">{t('highlight')}</span>
                    </h2>
                </motion.div>

                <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-[#e6edf5] shadow-card divide-y divide-[#e6edf5]">
                    {faqKeys.map((key, i) => (
                        <AccordionItem
                            key={key}
                            question={t(`${key}`)}
                            answer={t(`a${key.slice(1)}`)}
                            index={i}
                            inView={inView}
                        />
                    ))}
                </div>

                <div className="text-center mt-10">
                    <a
                        href={`/${locale}/support`}
                        className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#64748b] hover:text-[#1e3a5f] transition-all duration-200"
                    >
                        <span>¿Sigues con dudas? <span className="text-[#1e3a5f] underline hover:text-[#f59e0b]">Contacta a nuestro equipo</span></span>
                        <ChevronDown className="w-4 h-4 -rotate-90" />
                    </a>
                </div>
            </div>
        </section>
    );
}