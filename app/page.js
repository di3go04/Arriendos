'use client';

import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import Impacto from '@/components/Impacto';
import Contacto from '@/components/Contacto';
import Footer from '@/components/Footer';

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Impacto />
        <Contacto />
      </main>
      <Footer />
    </>
  );
}
