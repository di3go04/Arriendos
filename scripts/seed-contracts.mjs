// scripts/seed-contracts.js
// Seed the `contracts` table in Supabase with example contracts for demo.
// Usage: node scripts/seed-contracts.js
//
// Prerequisites:
//   1. The `contracts` table must exist in Supabase
//   2. You must have valid .env.local with NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
//   3. The properties referenced below must exist (IDs are placeholders — adjust as needed)

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const CONTRACTS = [
  {
    property_id: '00000000-0000-0000-0000-000000000001',
    property_title: 'Edificio Mediterráneo',
    tenant_name: 'Carlos López',
    tenant_email: 'carlos@email.com',
    tenant_phone: '+57 300 111 2233',
    monthly_rent: 1500000,
    deposit: 1500000,
    currency: 'COP',
    payment_day: 5,
    start_date: '2026-01-15',
    end_date: '2027-01-15',
    status: 'firmado',
    signed_by_landlord: true,
    signed_by_tenant: true,
    contract_text: `CONTRATO DE ARRENDAMIENTO

Entre el arrendador y Carlos López, identificado con cédula de ciudadanía, quien en adelante se denominará EL ARRENDATARIO, se celebra el presente contrato de arrendamiento del inmueble ubicado en Edificio Mediterráneo, que en adelante se denominará EL INMUEBLE.

CLÁUSULA PRIMERA — OBJETO: El arrendador da en arrendamiento a EL ARRENDATARIO el inmueble denominado Edificio Mediterráneo, para ser destinado exclusivamente como vivienda.

CLÁUSULA SEGUNDA — PLAZO: El término de duración del presente contrato será de 2026-01-15 a 2027-01-15, pudiendo ser prorrogado por acuerdo mutuo.

CLÁUSULA TERCERA — CANON DE ARRENDAMIENTO: El canon mensual es de $1,500,000, que EL ARRENDATARIO pagará dentro de los primeros 5 días de cada mes.

CLÁUSULA CUARTA — DEPÓSITO: EL ARRENDATARIO entrega en este acto la suma de $1,500,000 como depósito de garantía, que será devuelto al finalizar el contrato si el inmueble se entrega en buen estado.

CLÁUSULA QUINTA — MORA: En caso de mora en el pago del canon, EL ARRENDATARIO pagará un interés moratorio del 1.5% mensual sobre el valor adeudado.

CLÁUSULA SEXTA — SERVICIOS PÚBLICOS: Los servicios públicos serán pagados por EL ARRENDATARIO durante la vigencia del contrato.

CLÁUSULA SÉPTIMA — MANTENIMIENTO: EL ARRENDATARIO se obliga a mantener EL INMUEBLE en buen estado de conservación y realizará las reparaciones menores necesarias.

CLÁUSULA OCTAVA — TERMINACIÓN ANTICIPADA: Cualquiera de las partes podrá dar por terminado el contrato con un preaviso de 30 días calendario.

Para constancia se firma en la ciudad a los 15 días del mes de enero de 2026.`,
  },
  {
    property_id: '00000000-0000-0000-0000-000000000002',
    property_title: 'Casa Laureles',
    tenant_name: 'María García',
    tenant_email: 'maria@email.com',
    tenant_phone: '+57 300 222 3344',
    monthly_rent: 3200000,
    deposit: 3200000,
    currency: 'COP',
    payment_day: 5,
    start_date: '2026-02-01',
    end_date: '2027-02-01',
    status: 'pendiente_firma',
    signed_by_landlord: true,
    signed_by_tenant: false,
    contract_text: `CONTRATO DE ARRENDAMIENTO

Entre el arrendador y María García, identificado con cédula de ciudadanía, quien en adelante se denominará EL ARRENDATARIO, se celebra el presente contrato de arrendamiento del inmueble ubicado en Casa Laureles, que en adelante se denominará EL INMUEBLE.

CLÁUSULA PRIMERA — OBJETO: El arrendador da en arrendamiento a EL ARRENDATARIO el inmueble denominado Casa Laureles, para ser destinado exclusivamente como vivienda.

CLÁUSULA SEGUNDA — PLAZO: El término de duración del presente contrato será de 2026-02-01 a 2027-02-01, pudiendo ser prorrogado por acuerdo mutuo.

CLÁUSULA TERCERA — CANON DE ARRENDAMIENTO: El canon mensual es de $3,200,000, que EL ARRENDATARIO pagará dentro de los primeros 5 días de cada mes.

CLÁUSULA CUARTA — DEPÓSITO: EL ARRENDATARIO entrega en este acto la suma de $3,200,000 como depósito de garantía, que será devuelto al finalizar el contrato si el inmueble se entrega en buen estado.

CLÁUSULA QUINTA — MORA: En caso de mora en el pago del canon, EL ARRENDATARIO pagará un interés moratorio del 1.5% mensual sobre el valor adeudado.

Para constancia se firma en la ciudad a los 1 días del mes de febrero de 2026.`,
  },
  {
    property_id: '00000000-0000-0000-0000-000000000003',
    property_title: 'Apartamento Santa Fe',
    tenant_name: 'Laura Torres',
    tenant_email: 'laura@email.com',
    tenant_phone: '+57 300 333 4455',
    monthly_rent: 2100000,
    deposit: 2100000,
    currency: 'COP',
    payment_day: 10,
    start_date: '2026-07-01',
    end_date: '2027-07-01',
    status: 'borrador',
    signed_by_landlord: false,
    signed_by_tenant: false,
    contract_text: `CONTRATO DE ARRENDAMIENTO

Entre el arrendador y Laura Torres, se celebra el presente contrato de arrendamiento del inmueble ubicado en Apartamento Santa Fe.

CLÁUSULA PRIMERA — OBJETO: El arrendador da en arrendamiento a EL ARRENDATARIO el inmueble denominado Apartamento Santa Fe, para ser destinado exclusivamente como vivienda.

CLÁUSULA SEGUNDA — PLAZO: El término de duración del presente contrato será de 2026-07-01 a 2027-07-01, pudiendo ser prorrogado por acuerdo mutuo.

CLÁUSULA TERCERA — CANON DE ARRENDAMIENTO: El canon mensual es de $2,100,000, que EL ARRENDATARIO pagará dentro de los primeros 10 días de cada mes.

CLÁUSULA CUARTA — DEPÓSITO: EL ARRENDATARIO entrega en este acto la suma de $2,100,000 como depósito de garantía, que será devuelto al finalizar el contrato si el inmueble se entrega en buen estado.

Para constancia se firma en la ciudad a los 1 días del mes de julio de 2026.`,
  },
];

async function main() {
  console.log(`Seeding ${CONTRACTS.length} contract(s)...\n`);

  let inserted = 0;
  for (const contract of CONTRACTS) {
    const { error } = await supabase
      .from('contracts')
      .insert({
        property_id: contract.property_id,
        property_title: contract.property_title,
        tenant_name: contract.tenant_name,
        tenant_email: contract.tenant_email,
        tenant_phone: contract.tenant_phone,
        monthly_rent: contract.monthly_rent,
        deposit: contract.deposit,
        currency: contract.currency,
        payment_day: contract.payment_day,
        start_date: contract.start_date,
        end_date: contract.end_date,
        status: contract.status,
        signed_by_landlord: contract.signed_by_landlord,
        signed_by_tenant: contract.signed_by_tenant,
        contract_text: contract.contract_text,
      });

    if (error) {
      console.error(`  ERROR inserting "${contract.property_title}": ${error.message}`);
    } else {
      console.log(`  INSERTED — ${contract.property_title} (${contract.tenant_name})`);
      inserted++;
    }
  }

  console.log(`\nDone. ${inserted}/${CONTRACTS.length} contract(s) inserted.`);
}

main();
