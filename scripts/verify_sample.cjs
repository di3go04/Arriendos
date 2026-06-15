'use strict';

const requiredVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
];

let hasError = false;

for (const key of requiredVars) {
  const val = process.env[key];
  if (!val || val.startsWith('tu-') || val === '') {
    console.warn('⚠ Variable faltante o placeholder:', key);
    hasError = true;
  } else {
    console.log('✓', key, 'configurada');
  }
}

if (hasError) {
  console.log('\nCopia .env.example a .env.local y completa las variables.');
  process.exit(1);
} else {
  console.log('\n✓ Entorno verificado correctamente');
  process.exit(0);
}
