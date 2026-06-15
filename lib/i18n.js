'use client';

import { createContext, useContext, useState, useCallback } from 'react';

const translations = {
  es: {
    'nav.home': 'Inicio',
    'nav.features': 'Funcionalidades',
    'nav.pricing': 'Precios',
    'nav.impact': 'Impacto',
    'nav.contact': 'Contacto',
    'nav.login': 'Iniciar sesión',
    'nav.start': 'Comenzar',
    'hero.title': 'Automatiza la gestión de tus arriendos con Inteligencia Artificial',
    'hero.subtitle': 'Administra propiedades, contratos, pagos e inquilinos desde un solo lugar gracias a nuestra IA predictiva y un portal público optimizado para tus inquilinos.',
    'hero.cta': 'Comenzar gratis',
    'hero.demo': 'Solicitar demo',
    'hero.benefit1': 'Sin tarjeta de crédito',
    'hero.benefit2': 'Cancela cuando quieras',
    'hero.benefit3': 'Multi-idioma',
    'impact.title': 'Nuestro Impacto',
    'impact.subtitle': 'Resultados que transforman la gestión de arriendos',
    'impact.card1_label': 'eficiencia operativa',
    'impact.card1_desc': 'Automatización inteligente que reduce drásticamente los tiempos de gestión y elimina procesos manuales.',
    'impact.card2_label': 'disponibilidad total',
    'impact.card2_desc': 'Plataforma always-on con respuestas automatizadas y gestión ininterrumpida de tus procesos.',
    'impact.card3_label': 'ahorradas al mes',
    'impact.card3_desc': 'Recupera horas de trabajo productivo al delegar tareas repetitivas a nuestra inteligencia artificial.',
    'contact.title': 'Contáctanos',
    'contact.subtitle': 'Cuéntanos sobre tu proyecto y te responderemos en menos de 24 horas.',
    'contact.name': 'Nombre',
    'contact.email': 'Correo electrónico',
    'contact.message': 'Mensaje',
    'contact.submit': 'Enviar mensaje',
    'contact.success_title': '¡Mensaje enviado!',
    'contact.success_desc': 'Gracias por contactarnos. Te responderemos en menos de 24 horas.',
    'contact.err_name': 'Por favor ingresa tu nombre',
    'contact.err_email': 'Por favor ingresa un correo válido',
    'contact.err_msg': 'Por favor ingresa un mensaje',
    'footer.tagline': 'Plataforma PropTech para la gestión profesional de arrendamientos.',
    'footer.product': 'Producto',
    'footer.features': 'Características',
    'footer.pricing': 'Precios',
    'footer.demo': 'Demo interactiva',
    'footer.company': 'Compañía',
    'footer.contact': 'Contacto',
    'footer.privacy': 'Aviso de Privacidad',
    'footer.terms': 'Términos y Condiciones',
    'footer.copyright': '© 2026 RentNow. Todos los derechos reservados.',
  },
  en: {
    'nav.home': 'Home',
    'nav.features': 'Features',
    'nav.pricing': 'Pricing',
    'nav.impact': 'Impact',
    'nav.contact': 'Contact',
    'nav.login': 'Sign In',
    'nav.start': 'Get Started',
    'hero.title': 'Automate your rental management with Artificial Intelligence',
    'hero.subtitle': 'Manage properties, contracts, payments and tenants from one place thanks to our predictive AI and a public portal optimized for your tenants.',
    'hero.cta': 'Start Free',
    'hero.demo': 'Request Demo',
    'hero.benefit1': 'No credit card required',
    'hero.benefit2': 'Cancel anytime',
    'hero.benefit3': 'Multi-language',
    'impact.title': 'Our Impact',
    'impact.subtitle': 'Results that transform rental management',
    'impact.card1_label': 'operational efficiency',
    'impact.card1_desc': 'Intelligent automation that drastically reduces management times and eliminates manual processes.',
    'impact.card2_label': 'total availability',
    'impact.card2_desc': 'Always-on platform with automated responses and uninterrupted management of your processes.',
    'impact.card3_label': 'saved per month',
    'impact.card3_desc': 'Recover productive work hours by delegating repetitive tasks to our artificial intelligence.',
    'contact.title': 'Contact Us',
    'contact.subtitle': 'Tell us about your project and we will respond within 24 hours.',
    'contact.name': 'Name',
    'contact.email': 'Email',
    'contact.message': 'Message',
    'contact.submit': 'Send Message',
    'contact.success_title': 'Message sent!',
    'contact.success_desc': 'Thank you for contacting us. We will respond within 24 hours.',
    'contact.err_name': 'Please enter your name',
    'contact.err_email': 'Please enter a valid email',
    'contact.err_msg': 'Please enter a message',
    'footer.tagline': 'PropTech platform for professional rental management.',
    'footer.product': 'Product',
    'footer.features': 'Features',
    'footer.pricing': 'Pricing',
    'footer.demo': 'Interactive Demo',
    'footer.company': 'Company',
    'footer.contact': 'Contact',
    'footer.privacy': 'Privacy Policy',
    'footer.terms': 'Terms & Conditions',
    'footer.copyright': '© 2026 RentNow. All rights reserved.',
  },
};

const I18nContext = createContext(null);

export function I18nProvider({ children }) {
  const [lang, setLang] = useState('es');

  const toggleLang = useCallback(() => {
    setLang((prev) => (prev === 'es' ? 'en' : 'es'));
  }, []);

  return (
    <I18nContext.Provider value={{ lang, setLang, toggleLang }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n debe usarse dentro de I18nProvider');
  return ctx;
}

export function translate(key, lang) {
  return translations[lang]?.[key] || key;
}

export { translations, I18nContext };
