'use client';

import { useInView } from '@/hooks/useInView';
import { useTranslations } from 'next-intl';
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
            className="group border-b border-border-subtle last:border-b-0"
        >
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between gap-4 py-5 px-6 text-left transition-all duration-300 hover:bg-surface/80 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500"
                aria-expanded={isOpen}
                aria-controls={`faq-answer-${index}`}
            >
                <span className="font-semibold text-brand-800 text-sm md:text-base leading-relaxed flex-1">
                    {question}
                </span>
                <ChevronDown
                    className={`w-5 h-5 text-text-muted shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                />
            </button>
            <div
                id={`faq-answer-${index}`}
                role="region"
                className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}
            >
                <p className="px-6 pb-5 text-sm text-text-muted leading-relaxed">
                    {answer}
                </p>
            </div>
        </motion.div>
    );
}

export function FAQSection() {
    const [ref, inView] = useInView<HTMLDivElement>({ threshold: 0.05, once: true });
    const t = useTranslations('faq');

    return (
        <section ref={ref} id="faq" className="relative py-20 md:py-28 bg-white">
            <div className="absolute inset-0 bg-gradient-to-b from-surface to-transparent pointer-events-none" />
            <div className="relative mx-auto max-w-7xl px-5 md:px-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={inView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.5 }}
                    className="text-center max-w-2xl mx-auto mb-14"
                >
                    <span className="text-xs font-bold text-amber-500 uppercase tracking-[0.2em]">
                        {t('badge')}
                    </span>
                    <h2 className="font-display font-bold text-brand-900 text-3xl md:text-4xl lg:text-5xl leading-tight tracking-tight mt-3 mb-4">
                        {t('title')}<span className="text-amber-500">{t('highlight')}</span>
                    </h2>
                </motion.div>

                <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-border-subtle shadow-card divide-y divide-border-subtle">
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

                <div className="text-center mt-12 pt-8 border-t border-border-subtle max-w-lg mx-auto">
                    <p className="text-sm font-semibold text-brand-800 mb-4">
                        ¿Sigues con dudas?
                    </p>
                    <a
                        href="mailto:hola@rentnow.ai"
                        className="inline-flex items-center gap-2 text-sm font-medium text-text-muted bg-surface hover:bg-border-subtle border border-border-subtle px-5 py-2.5 rounded-xl transition-all duration-300 hover:-translate-y-0.5 active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500"
                    >
                        Contáctanos
                    </a>
                </div>
            </div>
        </section>
    );
}
