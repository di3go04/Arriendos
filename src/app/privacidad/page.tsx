'use client'

import { Building2, Shield, Mail, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function PrivacidadPage() {
  return (
    <main className="min-h-screen bg-[#F8FAFC] dark:bg-[#0F172A]">
      <div className="max-w-4xl mx-auto px-4 py-12 md:py-20">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-[#64748B] hover:text-[#1e3a5f] mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Volver al inicio
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-[#1e3a5f] flex items-center justify-center">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-[#1E293B] dark:text-white">Aviso de Privacidad</h1>
            <p className="text-sm text-[#64748B] dark:text-[#94A3B8]">Última actualización: Julio 2026</p>
          </div>
        </div>

        <div className="prose prose-sm md:prose-base max-w-none dark:prose-invert space-y-8">
          <Section title="1. Responsable del Tratamiento">
            <p><strong>RentNow S.A.S.</strong> (en adelante, &ldquo;RentNow&rdquo;), con domicilio en Bogotá D.C., Colombia, es el responsable del tratamiento de sus datos personales.</p>
            <div className="flex items-center gap-2 text-sm text-[#64748B] mt-2">
              <Mail className="w-4 h-4" /> privacidad@rentnow.app
            </div>
          </Section>

          <Section title="2. Datos que Recolectamos">
            <h4 className="font-semibold text-[#1E293B] dark:text-white mt-4">2.1 Información de registro</h4>
            <ul>
              <li>Nombre completo, correo electrónico, número de teléfono</li>
              <li>Rol (arrendador / arrendatario)</li>
              <li>Moneda preferida y configuración de idioma</li>
            </ul>

            <h4 className="font-semibold text-[#1E293B] dark:text-white mt-4">2.2 Información de propiedades y contratos</h4>
            <ul>
              <li>Dirección, tipo, área y características de las propiedades</li>
              <li>Datos de inquilinos (nombre, documento, contacto)</li>
              <li>Términos contractuales y montos de arriendo</li>
            </ul>

            <h4 className="font-semibold text-[#1E293B] dark:text-white mt-4">2.3 Información de pago</h4>
            <ul>
              <li>Métodos de pago (procesados de forma segura por Stripe y Mercado Pago)</li>
              <li>Historial de transacciones y estado de pagos</li>
              <li>Información de suscripción y facturación</li>
            </ul>

            <h4 className="font-semibold text-[#1E293B] dark:text-white mt-4">2.4 Datos técnicos</h4>
            <ul>
              <li>Dirección IP, tipo de navegador, sistema operativo</li>
              <li>Páginas visitadas y tiempo de navegación</li>
              <li>Cookies funcionales y analíticas</li>
            </ul>
          </Section>

          <Section title="3. Finalidades del Tratamiento">
            <ul>
              <li>Prestar el servicio de gestión de arrendamientos</li>
              <li>Procesar pagos y suscripciones</li>
              <li>Generar contratos y documentos legales</li>
              <li>Enviar notificaciones y recordatorios</li>
              <li>Mejorar la plataforma y la experiencia del usuario</li>
              <li>Cumplir con obligaciones legales y regulatorias</li>
            </ul>
          </Section>

          <Section title="4. Transferencia a Terceros">
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-[#E2E8F0] dark:border-[#334155]">
                    <th className="text-left py-2 font-semibold text-[#1E293B] dark:text-white">Tercero</th>
                    <th className="text-left py-2 font-semibold text-[#1E293B] dark:text-white">Finalidad</th>
                    <th className="text-left py-2 font-semibold text-[#1E293B] dark:text-white">Marco legal</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-[#E2E8F0] dark:border-[#334155]">
                    <td className="py-2">Stripe Inc.</td>
                    <td className="py-2">Procesamiento de pagos</td>
                    <td className="py-2">PCI-DSS</td>
                  </tr>
                  <tr className="border-b border-[#E2E8F0] dark:border-[#334155]">
                    <td className="py-2">Mercado Pago</td>
                    <td className="py-2">Procesamiento de pagos LATAM</td>
                    <td className="py-2">PCI-DSS</td>
                  </tr>
                  <tr>
                    <td className="py-2">Vercel Inc.</td>
                    <td className="py-2">Alojamiento e infraestructura</td>
                    <td className="py-2">Contrato DPA</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Section>

          <Section title="5. Derechos del Titular">
            <p>Usted tiene derecho a:</p>
            <ul>
              <li><strong>Acceder</strong> a sus datos personales</li>
              <li><strong>Rectificar</strong> datos inexactos o incompletos</li>
              <li><strong>Cancelar</strong> sus datos cuando no sean necesarios</li>
              <li><strong>Oponerse</strong> al tratamiento para fines específicos</li>
              <li><strong>Portar</strong> sus datos a otro proveedor</li>
            </ul>
            <p className="mt-4">Para ejercer sus derechos, escriba a <strong>privacidad@rentnow.app</strong>. Responderemos en un plazo máximo de 15 días hábiles.</p>
          </Section>

          <Section title="6. Seguridad de la Información">
            <p>Implementamos medidas técnicas y organizativas para proteger sus datos:</p>
            <ul>
              <li>Cifrado SSL/TLS en todas las comunicaciones</li>
              <li>Almacenamiento cifrado de datos sensibles</li>
              <li>Autenticación segura con Supabase Auth y JWT</li>
              <li>Monitoreo continuo de accesos</li>
              <li>Copias de seguridad cifradas</li>
            </ul>
          </Section>

          <Section title="7. Vigencia de los Datos">
            <p>Conservamos sus datos personales durante la vigencia de su relación contractual con RentNow y hasta 5 años después de terminada, conforme al artículo 28 de la Ley 962 de 2005. Los datos anónimos con fines estadísticos podrán conservarse por tiempo indefinido.</p>
          </Section>

          <Section title="8. Uso de Cookies">
            <p>Utilizamos cookies funcionales (necesarias para el funcionamiento) y analíticas (para mejorar la plataforma). Puede gestionar sus preferencias desde el banner de consentimiento al ingresar al sitio.</p>
          </Section>

          <Section title="9. Legislación Aplicable">
            <p>Este aviso se rige por la Ley 1581 de 2012 (Protección de Datos Personales), el Decreto 1377 de 2013 y la Circular Externa 029 de 2024 de la Superintendencia de Industria y Comercio de Colombia.</p>
          </Section>

          <Section title="10. Contacto">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-[#1e3a5f]" />
              <div>
                <p className="font-semibold text-[#1E293B] dark:text-white">Delegado de Protección de Datos</p>
                <p className="text-sm text-[#64748B]">privacidad@rentnow.app</p>
              </div>
            </div>
            <div className="flex items-center gap-3 mt-3">
              <Building2 className="w-5 h-5 text-[#1e3a5f]" />
              <div>
                <p className="font-semibold text-[#1E293B] dark:text-white">RentNow S.A.S.</p>
                <p className="text-sm text-[#64748B]">Bogotá D.C., Colombia</p>
              </div>
            </div>
          </Section>
        </div>

        <div className="mt-12 pt-8 border-t border-[#E2E8F0] dark:border-[#334155] text-center">
          <p className="text-sm text-[#94A3B8]">
            &copy; {new Date().getFullYear()} RentNow S.A.S. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </main>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-xl font-bold text-[#1E293B] dark:text-white mb-4">{title}</h2>
      <div className="text-[#475569] dark:text-[#CBD5E1] leading-relaxed space-y-3">
        {children}
      </div>
    </section>
  )
}
