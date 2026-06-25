-- Demo seed.
-- Antes de ejecutar, crea dos usuarios en Supabase Auth y reemplaza estos UUIDs.

DO $$
DECLARE
  landlord uuid := '00000000-0000-0000-0000-000000000001';
  tenant uuid := '00000000-0000-0000-0000-000000000002';
  property_id uuid;
  contract_id uuid;
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, role, preferred_currency)
  VALUES
    (landlord, 'Laura Administradora', '+57 300 000 0001', 'arrendador', 'COP'),
    (tenant, 'Carlos Inquilino', '+57 300 000 0002', 'arrendatario', 'COP')
  ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, role = EXCLUDED.role;

  INSERT INTO public.properties (
    owner_id, title, type, address, city, area_sqm, bedrooms, bathrooms,
    description, amenities, monthly_rent, deposit, available_from, status, image_urls
  )
  VALUES (
    landlord, 'Apartamento demo Chapinero', 'apartamento', 'Cra 10 #20-30',
    'Bogota', 72, 3, 2, 'Apartamento demo para ventas y QA.',
    ARRAY['Porteria','Parqueadero','Balcon'], 2500000, 2500000, CURRENT_DATE, 'disponible', ARRAY[]::text[]
  )
  RETURNING id INTO property_id;

  INSERT INTO public.contracts (
    property_id, landlord_id, tenant_id, contract_number, status,
    start_date, end_date, monthly_rent, deposit, payment_day, contract_content
  )
  VALUES (
    property_id, landlord, tenant, 'DEMO-001', 'activo',
    CURRENT_DATE, CURRENT_DATE + INTERVAL '12 months', 2500000, 2500000, 5,
    '<h1>Contrato demo</h1><p>Contrato de arrendamiento de demostracion.</p>'
  )
  RETURNING id INTO contract_id;

  INSERT INTO public.payments (contract_id, tenant_id, amount, due_date, paid, month_year)
  VALUES
    (contract_id, tenant, 2500000, CURRENT_DATE - INTERVAL '30 days', true, 'Mes anterior'),
    (contract_id, tenant, 2500000, CURRENT_DATE, false, 'Mes actual');

  INSERT INTO public.property_leads (property_id, owner_id, lead_name, lead_email, lead_phone, lead_message)
  VALUES (property_id, landlord, 'Lead Demo', 'lead@example.com', '+57 300 000 0003', 'Quiero conocer el apartamento.');
END $$;

