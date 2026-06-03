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

                <div className="text-center mt-12 pt-8 border-t border-[#e6edf5] max-w-lg mx-auto">
                    <p className="text-sm font-semibold text-[#1e293b] mb-4">¿Sigues con dudas? Contáctanos</p>
                    <div className="flex flex-wrap items-center justify-center gap-4">
                        <a
                            href="mailto:rentnow.ejemplo@gmail.com"
                            className="inline-flex items-center gap-2 text-xs font-medium text-[#64748b] bg-[#f8fafc] hover:bg-[#e6edf5] border border-[#e6edf5] px-4 py-2.5 rounded-xl transition-all duration-200 hover:scale-[1.02]"
                        >
                            <svg className="w-4 h-4 text-[#ea4335]" viewBox="0 0 24 24" fill="currentColor"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" /></svg>
                            rentnow.ejemplo@gmail.com
                        </a>
                        <a
                            href="https://wa.me/573001234567"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-xs font-medium text-[#64748b] bg-[#f8fafc] hover:bg-[#e6edf5] border border-[#e6edf5] px-4 py-2.5 rounded-xl transition-all duration-200 hover:scale-[1.02]"
                        >
                            <svg className="w-4 h-4 text-[#25D366]" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
                            +57 300 123 4567
                        </a>
                    </div>
                </div>
            </div>
        </section>
    );
}