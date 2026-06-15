CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
  demo_user_id uuid;
  property_ids uuid[] := ARRAY[]::uuid[];
  tenant_ids uuid[] := ARRAY[]::uuid[];
  pid uuid;
  tid uuid;
  prop_titles text[] := ARRAY[
    'Apartamento Chapinero Alto',
    'Oficina Centro Internacional',
    'Casa Usaquén'
  ];
  tenant_data text[][] := ARRAY[
    ARRAY['Carlos Mendoza', 'carlos@ejemplo.com', '+57 310 111 2233', 'CC-12345678'],
    ARRAY['María Gómez', 'maria@ejemplo.com', '+57 320 222 3344', 'CC-23456789'],
    ARRAY['Andrés Ruiz', 'andres@ejemplo.com', '+57 300 333 4455', 'CC-34567890']
  ];
  rent_amounts int[] := ARRAY[2800000, 3500000, 5200000];
  i int;
BEGIN
  demo_user_id := current_setting('app.demo_user_id', true)::uuid;

  IF demo_user_id IS NULL THEN
    RAISE NOTICE 'app.demo_user_id no está definido. Crea un usuario primero.';
    RETURN;
  END IF;

  INSERT INTO public.profiles (id, full_name, phone, role, preferred_currency)
  VALUES (demo_user_id, 'Laura Administradora Demo', '+57 300 000 0001', 'arrendador', 'COP')
  ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, role = EXCLUDED.role;

  FOR i IN 1..array_length(prop_titles, 1) LOOP
    INSERT INTO public.properties (
      owner_id, title, type, address, city, area_sqm, bedrooms, bathrooms,
      description, amenities, monthly_rent, deposit, available_from, status, image_urls
    )
    VALUES (
      demo_user_id,
      prop_titles[i],
      CASE i WHEN 1 THEN 'apartamento' WHEN 2 THEN 'oficina' ELSE 'casa' END,
      CASE i WHEN 1 THEN 'Cra 7 #45-12' WHEN 2 THEN 'Cra 13 #26-45' ELSE 'Cra 6 #119-30' END,
      'Bogotá',
      CASE i WHEN 1 THEN 85 WHEN 2 THEN 120 ELSE 200 END,
      CASE i WHEN 1 THEN 3 WHEN 2 THEN 1 ELSE 4 END,
      CASE i WHEN 1 THEN 2 WHEN 2 THEN 1 ELSE 3 END,
      CASE i WHEN 1 THEN 'Hermoso apartamento con vista a los cerros orientales.'
              WHEN 2 THEN 'Oficina ejecutiva en edificio corporativo.'
              ELSE 'Casa colonial restaurada con jardín y chimenea.' END,
      CASE i WHEN 1 THEN ARRAY['Portería','Parqueadero','Balcón']
              WHEN 2 THEN ARRAY['Seguridad 24h','Parqueadero','Ascensor']
              ELSE ARRAY['Jardín','Chimenea','Terraza','Garaje'] END,
      rent_amounts[i],
      rent_amounts[i],
      CURRENT_DATE,
      'disponible',
      ARRAY[]::text[]
    )
    ON CONFLICT DO NOTHING
    RETURNING id INTO pid;

    IF pid IS NOT NULL THEN
      property_ids := array_append(property_ids, pid);
    END IF;
  END LOOP;

  IF array_length(property_ids, 1) = 0 THEN
    SELECT ARRAY(SELECT id FROM public.properties WHERE owner_id = demo_user_id LIMIT 3) INTO property_ids;
  END IF;

  FOR i IN 1..array_length(tenant_data, 1) LOOP
    INSERT INTO public.tenants (name, email, phone, document_id)
    VALUES (tenant_data[i][1], tenant_data[i][2], tenant_data[i][3], tenant_data[i][4])
    ON CONFLICT DO NOTHING
    RETURNING id INTO tid;

    IF tid IS NOT NULL THEN
      tenant_ids := array_append(tenant_ids, tid);
    END IF;
  END LOOP;

  IF array_length(tenant_ids, 1) = 0 THEN
    SELECT ARRAY(SELECT id FROM public.tenants LIMIT 3) INTO tenant_ids;
  END IF;

  FOR i IN 1..least(array_length(property_ids, 1), array_length(tenant_ids, 1)) LOOP
    INSERT INTO public.contracts (
      property_id, landlord_id, tenant_id, contract_number, status,
      start_date, end_date, monthly_rent, deposit, payment_day, contract_content
    )
    VALUES (
      property_ids[i],
      demo_user_id,
      tenant_ids[i],
      'RN-' || LPAD(i::text, 4, '0'),
      'activo',
      CURRENT_DATE - INTERVAL '3 months',
      CURRENT_DATE + INTERVAL '9 months',
      rent_amounts[i],
      rent_amounts[i],
      5,
      '<h1>Contrato de Arrendamiento</h1><p>Contrato generado automáticamente para demostración.</p>'
    )
    ON CONFLICT DO NOTHING;

    INSERT INTO public.payments (contract_id, tenant_id, amount, due_date, paid, month_year)
    VALUES (
      (SELECT id FROM public.contracts WHERE contract_number = 'RN-' || LPAD(i::text, 4, '0') LIMIT 1),
      tenant_ids[i],
      rent_amounts[i],
      CURRENT_DATE - INTERVAL '1 month',
      true,
      to_char(CURRENT_DATE - INTERVAL '1 month', 'YYYY-MM')
    )
    ON CONFLICT DO NOTHING;
  END LOOP;

  RAISE NOTICE 'Seed completado: % propiedades, % inquilinos',
    array_length(property_ids, 1), array_length(tenant_ids, 1);
END $$;
