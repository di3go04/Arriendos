'use client';

import { useState, useRef, useEffect } from 'react';
import { translate, useI18n } from '@/lib/i18n';

export default function Contacto() {
  const { lang } = useI18n();
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [fading, setFading] = useState(false);
  const sectionRef = useRef(null);
  const shakeTimers = useRef({});

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  function clearShake(field) {
    if (shakeTimers.current[field]) {
      clearTimeout(shakeTimers.current[field]);
    }
  }

  function shake(el) {
    if (!el) return;
    clearShake(el.id);
    el.classList.remove('animate-shake');
    void el.offsetWidth;
    el.classList.add('animate-shake');
    shakeTimers.current[el.id] = setTimeout(() => {
      el.classList.remove('animate-shake');
    }, 500);
  }

  function validate() {
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = translate('contact.err_name', lang);
    }
    if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = translate('contact.err_email', lang);
    }
    if (!formData.message.trim()) {
      newErrors.message = translate('contact.err_msg', lang);
    }
    return newErrors;
  }

  function handleSubmit(e) {
    e.preventDefault();
    const newErrors = validate();
    setErrors(newErrors);

    if (newErrors.name) shake(document.getElementById('field_name'));
    if (newErrors.email) shake(document.getElementById('field_email'));
    if (newErrors.message) shake(document.getElementById('field_msg'));

    if (Object.keys(newErrors).length > 0) return;

    setFading(true);
    setTimeout(() => {
      setSubmitted(true);
      setFading(false);
    }, 400);
  }

  function handleChange(field, value) {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy[field];
        return copy;
      });
    }
  }

  const t = (key) => translate(key, lang);

  return (
    <section id="contacto" className="py-24 md:py-32 px-6 md:px-10 bg-gray-50 dark:bg-rn-900 transition-colors duration-300">
      <div className="max-w-3xl mx-auto">
        <div ref={sectionRef} className="text-center mb-16 fade-on-scroll">
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-gray-900 dark:text-white mb-4">
            {t('contact.title')}
          </h2>
          <p className="text-lg text-gray-600 dark:text-white/60 max-w-xl mx-auto">
            {t('contact.subtitle')}
          </p>
        </div>

        {!submitted ? (
          <div
            className="fade-on-scroll"
            style={{
              opacity: fading ? 0 : undefined,
              transform: fading ? 'scale(0.96)' : undefined,
              transition: 'opacity 0.4s ease-out, transform 0.4s ease-out',
            }}
          >
            <form onSubmit={handleSubmit} noValidate>
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-800 dark:text-white/80 mb-2">
                  {t('contact.name')}
                </label>
                <input
                  id="field_name"
                  type="text"
                  placeholder={t('contact.name')}
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  className={`w-full bg-transparent border-b py-3 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/30 outline-none transition-colors duration-300 text-sm ${
                    errors.name ? 'border-red-500' : 'border-gray-300 dark:border-white/20 focus:border-accent'
                  }`}
                />
                {errors.name && (
                  <div className="text-xs text-red-500 mt-1">{errors.name}</div>
                )}
              </div>

              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-800 dark:text-white/80 mb-2">
                  {t('contact.email')}
                </label>
                <input
                  id="field_email"
                  type="email"
                  placeholder={t('contact.email')}
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className={`w-full bg-transparent border-b py-3 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/30 outline-none transition-colors duration-300 text-sm ${
                    errors.email ? 'border-red-500' : 'border-gray-300 dark:border-white/20 focus:border-accent'
                  }`}
                />
                {errors.email && (
                  <div className="text-xs text-red-500 mt-1">{errors.email}</div>
                )}
              </div>

              <div className="mb-8">
                <label className="block text-sm font-semibold text-gray-800 dark:text-white/80 mb-2">
                  {t('contact.message')}
                </label>
                <textarea
                  id="field_msg"
                  placeholder={t('contact.message')}
                  rows="4"
                  value={formData.message}
                  onChange={(e) => handleChange('message', e.target.value)}
                  className={`w-full bg-transparent border-b py-3 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/30 outline-none transition-colors duration-300 text-sm resize-none ${
                    errors.message ? 'border-red-500' : 'border-gray-300 dark:border-white/20 focus:border-accent'
                  }`}
                />
                {errors.message && (
                  <div className="text-xs text-red-500 mt-1">{errors.message}</div>
                )}
              </div>

              <button
                type="submit"
                className="w-full py-4 text-base font-semibold rounded-pill bg-accent hover:bg-accent-hover text-rn-900 transition-all duration-300 hover:shadow-gold"
              >
                {t('contact.submit')}
              </button>
            </form>
          </div>
        ) : (
          <div className="text-center animate-fade-in">
            <div className="w-20 h-20 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-accent" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-3">
              {t('contact.success_title')}
            </h3>
            <p className="text-gray-600 dark:text-white/60 text-lg">
              {t('contact.success_desc')}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
