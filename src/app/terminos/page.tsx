'use client'

import { Building2, FileText, Mail, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function TerminosPage() {
  return (
    <main className="min-h-screen bg-[#F8FAFC] dark:bg-[#0F172A]">
      <div className="max-w-4xl mx-auto px-4 py-12 md:py-20">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-[#64748B] hover:text-[#1e3a5f] mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Volver al inicio
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-[#1e3a5f] flex items-center justify-center">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-[#1E293B] dark:text-white">Términos y Condiciones</h1>
            <p className="text-sm text-[#64748B] dark:text-[#94A3B8]">Última actualización: Julio 2026</p>
          </div>
        </div>

        <div className="prose prose-sm md:prose-base max-w-none dark:prose-invert space-y-8">
          <Section title="1. Aceptación de los Términos">
            <p>Al acceder y utilizar la plataforma RentNow (en adelante, la &ldquo;Plataforma&rdquo;), usted acepta estar sujeto a estos Términos y Condiciones. Si no está de acuerdo con alguno de estos términos, no utilice la Plataforma.</p>
            <p>RentNow S.A.S. se reserva el derecho de modificar estos términos en cualquier momento. Las modificaciones entrarán en vigor inmediatamente después de su publicación en la Plataforma.</p>
          </Section>

          <Section title="2. Definiciones">
            <ul>
              <li><strong>Plataforma:</strong> Aplicación web RentNow accesible desde rentnow.app</li>
              <li><strong>Usuario:</strong> Persona natural o jurídica que se registra en la Plataforma</li>
              <li><strong>Arrendador:</strong> Usuario que publica propiedades en arriendo</li>
              <li><strong>Arrendatario:</strong> Usuario que busca y alquila propiedades</li>
              <li><strong>Contrato Digital:</strong> Documento legal generado y firmado electrónicamente a través de la Plataforma</li>
            </ul>
          </Section>

          <Section title="3. Registro y Cuenta">
            <ul>
              <li>Debe proporcionar información veraz y mantenerla actualizada</li>
              <li>Es responsable de mantener la confidencialidad de sus credenciales</li>
              <li>No puede crear múltiples cuentas sin autorización</li>
              <li>RentNow se reserva el derecho de suspender cuentas que violen estos términos</li>
              <li>La creación de cuenta implica la aceptación de estos Términos y el Aviso de Privacidad</li>
            </ul>
          </Section>

          <Section title="4. Planes y Suscripciones">
            <h4 className="font-semibold text-[#1E293B] dark:text-white mt-4">4.1 Planes disponibles</h4>
            <ul>
              <li><strong>Básico (gratuito):</strong> Hasta 2 propiedades y 2 inquilinos, panel simple</li>
              <li><strong>Profesional ($12 USD/mes):</strong> Hasta 10 propiedades, inquilinos ilimitados, IA, firma digital, API</li>
              <li><strong>Empresa ($24 USD/mes):</strong> Propiedades ilimitadas, multi-usuario, white label, soporte 24/7</li>
            </ul>

            <h4 className="font-semibold text-[#1E293B] dark:text-white mt-4">4.2 Facturación</h4>
            <ul>
              <li>Los pagos se procesan a través de Stripe o Mercado Pago</li>
              <li>Las suscripciones se renuevan automáticamente cada mes</li>
              <li>Puede cancelar en cualquier momento desde su panel de configuración</li>
              <li>Al cancelar, el plan continúa activo hasta el final del período pagado</li>
            </ul>
          </Section>

          <Section title="5. Propiedades y Contratos">
            <ul>
              <li>El arrendador es responsable de la veracidad de la información publicada</li>
              <li>Los contratos digitales generados tienen validez jurídica según la Ley 527 de 1999 y el Decreto 2364 de 2012</li>
              <li>RentNow no se hace responsable por el incumplimiento de pagos entre arrendadores e inquilinos</li>
              <li>Las imágenes y descripciones de propiedades deben ser precisas y actualizadas</li>
            </ul>
          </Section>

          <Section title="6. Firma Electrónica">
            <p>Los contratos firmados electrónicamente a través de la Plataforma tienen plena validez jurídica conforme a:</p>
            <ul>
              <li>Ley 527 de 1999 (Comercio Electrónico en Colombia)</li>
              <li>Decreto 2364 de 2012 (Firma Electrónica)</li>
              <li>Reglamento eIDAS (Unión Europea) para usuarios europeos</li>
            </ul>
          </Section>

          <Section title="7. Propiedad Intelectual">
            <p>Todo el contenido, diseño, código fuente, logotipos y marcas de la Plataforma son propiedad de RentNow S.A.S. o cuentan con las licencias correspondientes. El usuario no puede:</p>
            <ul>
              <li>Copiar, modificar o distribuir el código sin autorización</li>
              <li>Utilizar la marca RentNow sin consentimiento</li>
              <li>Realizar ingeniería inversa de la Plataforma</li>
            </ul>
          </Section>

          <Section title="8. Limitación de Responsabilidad">
            <p>RentNow no será responsable por:</p>
            <ul>
              <li>Daños indirectos, incidentales o consecuentes</li>
              <li>Pérdida de datos o interrupción del servicio</li>
              <li>Actos de terceros, incluyendo proveedores de pago</li>
              <li>Incumplimientos contractuales entre usuarios de la Plataforma</li>
            </ul>
            <p className="mt-4">La responsabilidad máxima de RentNow en ningún caso excederá el valor de las tarifas pagadas por el usuario en los 12 meses anteriores al reclamo.</p>
          </Section>

          <Section title="9. Privacidad y Datos">
            <p>El tratamiento de datos personales se rige por nuestro <Link href="/privacidad" className="text-[#1e3a5f] underline">Aviso de Privacidad</Link>, que forma parte integral de estos Términos.</p>
          </Section>

          <Section title="10. Terminación">
            <p>RentNow puede suspender o terminar el acceso a la Plataforma si:</p>
            <ul>
              <li>El usuario viola estos Términos y Condiciones</li>
              <li>Se detecta actividad fraudulenta o ilegal</li>
              <li>El usuario no paga las tarifas aplicables</li>
              <li>Por solicitud de autoridad competente</li>
            </ul>
          </Section>

          <Section title="11. Ley Aplicable y Jurisdicción">
            <p>Estos Términos se rigen por las leyes de la República de Colombia. Cualquier controversia será sometida a los tribunales de la ciudad de Bogotá D.C.</p>
          </Section>

          <Section title="12. Contacto">
            <p>Para cualquier consulta sobre estos términos, contáctenos:</p>
            <div className="flex items-center gap-3 mt-2">
              <Mail className="w-5 h-5 text-[#1e3a5f]" />
              <div>
                <p className="font-semibold text-[#1E293B] dark:text-white">RentNow S.A.S.</p>
                <p className="text-sm text-[#64748B]">legal@rentnow.app</p>
              </div>
            </div>
            <div className="flex items-center gap-3 mt-3">
              <Building2 className="w-5 h-5 text-[#1e3a5f]" />
              <div>
                <p className="font-semibold text-[#1E293B] dark:text-white">Dirección</p>
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
