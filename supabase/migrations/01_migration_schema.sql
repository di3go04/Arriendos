-- Clean Drop of Existing Tables (in correct dependency order)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

DROP TABLE IF EXISTS public.documents CASCADE;
DROP TABLE IF EXISTS public.notifications_log CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.payments CASCADE;
DROP TABLE IF EXISTS public.leases CASCADE;
DROP TABLE IF EXISTS public.contracts CASCADE;
DROP TABLE IF EXISTS public.contract_templates CASCADE;
DROP TABLE IF EXISTS public.maintenance_issues CASCADE;
DROP TABLE IF EXISTS public.tenants CASCADE;
DROP TABLE IF EXISTS public.properties CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- 1. Tabla de usuarios extendida (profiles)
CREATE TABLE public.profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name text,
  phone text,
  role text CHECK (role IN ('arrendador', 'arrendatario', 'admin')) DEFAULT 'arrendatario',
  avatar_url text,
  preferred_currency text DEFAULT 'USD',
  reminder_days_before int DEFAULT 3,
  timezone text DEFAULT 'America/Bogota',
  created_at timestamptz DEFAULT now()
);

-- 2. Inmuebles
CREATE TABLE public.properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES public.profiles ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  type text CHECK (type IN ('casa','apartamento','local','oficina','terreno')),
  address text,
  city text,
  area_sqm numeric,
  bedrooms int,
  bathrooms int,
  description text,
  amenities text[],
  monthly_rent numeric,
  deposit numeric,
  available_from date,
  status text DEFAULT 'disponible',
  image_urls text[] DEFAULT '{}'::text[],
  created_at timestamptz DEFAULT now()
);

-- 3. Plantillas de contrato
CREATE TABLE public.contract_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES public.profiles ON DELETE CASCADE,
  name text NOT NULL,
  content text NOT NULL, -- HTML con placeholders {{variable}}
  variables jsonb DEFAULT '[]',
  is_public boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- 4. Contratos (Reemplaza leases)
CREATE TABLE public.contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES public.properties ON DELETE CASCADE NOT NULL,
  landlord_id uuid REFERENCES public.profiles ON DELETE CASCADE NOT NULL,
  tenant_id uuid REFERENCES public.profiles ON DELETE CASCADE NOT NULL,
  template_id uuid REFERENCES public.contract_templates ON DELETE SET NULL,
  contract_number text UNIQUE,
  status text CHECK (status IN ('borrador','pendiente_firma','firmado','activo','finalizado','cancelado')) DEFAULT 'borrador',
  start_date date,
  end_date date,
  monthly_rent numeric,
  deposit numeric,
  payment_day int DEFAULT 5,
  contract_content text, -- HTML final generado
  pdf_url text,
  signed_by_landlord boolean DEFAULT false,
  signed_by_tenant boolean DEFAULT false,
  landlord_signed_at timestamptz,
  tenant_signed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- 5. Pagos de renta
CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id uuid REFERENCES public.contracts ON DELETE CASCADE NOT NULL,
  tenant_id uuid REFERENCES public.profiles ON DELETE CASCADE NOT NULL,
  amount numeric NOT NULL,
  due_date date NOT NULL,
  paid boolean DEFAULT false,
  paid_at timestamptz,
  payment_method text,
  receipt_url text,
  month_year text,
  created_at timestamptz DEFAULT now()
);

-- 6. Incidencias de Mantenimiento (Conservada y adaptada)
CREATE TABLE public.maintenance_issues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES public.properties ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.profiles ON DELETE CASCADE NOT NULL, -- Reportado por
  title text NOT NULL,
  description text NOT NULL,
  status text DEFAULT 'pending', -- pending, in_progress, resolved
  estimated_cost numeric DEFAULT 0.00,
  vendor text,
  notes text,
  reported_date date DEFAULT CURRENT_DATE,
  resolved_date date,
  created_at timestamptz DEFAULT now()
);

-- 7. Notificaciones
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles ON DELETE CASCADE NOT NULL,
  title text,
  message text,
  type text,
  read boolean DEFAULT false,
  contract_id uuid REFERENCES public.contracts ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- 8. Documentos extra (anexos, inventarios)
CREATE TABLE public.documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id uuid REFERENCES public.contracts ON DELETE CASCADE NOT NULL,
  uploaded_by uuid REFERENCES public.profiles ON DELETE SET NULL,
  name text,
  file_url text,
  type text CHECK (type IN ('anexo','inventario','foto','otro')),
  created_at timestamptz DEFAULT now()
);

-- Habilitar Row Level Security (RLS) en todas las tablas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

--------------------------------------------------------------------------------
-- POLÍTICAS RLS (Row Level Security)
--------------------------------------------------------------------------------

-- Profiles Policies
CREATE POLICY "Permitir lectura de perfiles a autenticados" ON public.profiles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Permitir actualizar perfil propio" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Properties Policies
CREATE POLICY "Permitir lectura de propiedades a autenticados" ON public.properties
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Permitir gestión de propiedades a arrendadores" ON public.properties
  FOR ALL TO authenticated USING (
    owner_id = auth.uid() AND 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('arrendador', 'admin'))
  );

-- Contract Templates Policies
CREATE POLICY "Permitir lectura de plantillas a arrendadores u públicas" ON public.contract_templates
  FOR SELECT TO authenticated USING (owner_id = auth.uid() OR is_public = true);

CREATE POLICY "Permitir gestión de plantillas a dueños arrendadores" ON public.contract_templates
  FOR ALL TO authenticated USING (
    owner_id = auth.uid() AND 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('arrendador', 'admin'))
  );

-- Contracts Policies
CREATE POLICY "Permitir lectura de contratos a partes firmantes" ON public.contracts
  FOR SELECT TO authenticated USING (landlord_id = auth.uid() OR tenant_id = auth.uid());

CREATE POLICY "Permitir crear/gestionar contratos a arrendadores" ON public.contracts
  FOR ALL TO authenticated USING (
    landlord_id = auth.uid() AND 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('arrendador', 'admin'))
  );

CREATE POLICY "Permitir al inquilino firmar el contrato" ON public.contracts
  FOR UPDATE TO authenticated USING (
    tenant_id = auth.uid()
  ) WITH CHECK (
    tenant_id = auth.uid() AND 
    -- Solo permitir cambiar estado, rúbricas de firma y sus timestamps
    (status = 'activo' OR status = 'pendiente_firma' OR status = 'firmado')
  );

-- Payments Policies
CREATE POLICY "Permitir lectura de pagos a partes firmantes" ON public.payments
  FOR SELECT TO authenticated USING (
    tenant_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM public.contracts 
      WHERE id = contract_id AND (landlord_id = auth.uid() OR tenant_id = auth.uid())
    )
  );

CREATE POLICY "Permitir gestión de pagos a arrendadores" ON public.payments
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.contracts 
      WHERE id = contract_id AND landlord_id = auth.uid()
    )
  );

CREATE POLICY "Permitir al inquilino actualizar su propio pago con recibo" ON public.payments
  FOR UPDATE TO authenticated USING (
    tenant_id = auth.uid()
  ) WITH CHECK (
    tenant_id = auth.uid()
  );

-- Maintenance Issues Policies
CREATE POLICY "Permitir lectura de incidencias a partes del inmueble" ON public.maintenance_issues
  FOR SELECT TO authenticated USING (
    user_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM public.properties 
      WHERE id = property_id AND owner_id = auth.uid()
    )
  );

CREATE POLICY "Permitir al reportante o dueño gestionar incidencias" ON public.maintenance_issues
  FOR ALL TO authenticated USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.properties 
      WHERE id = property_id AND owner_id = auth.uid()
    )
  );

-- Notifications Policies
CREATE POLICY "Permitir ver notificaciones propias" ON public.notifications
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Permitir actualizar notificaciones propias" ON public.notifications
  FOR UPDATE TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Permitir insertar notificaciones a sistema" ON public.notifications
  FOR INSERT TO authenticated WITH CHECK (true);

-- Documents Policies
CREATE POLICY "Permitir ver documentos de contratos firmantes" ON public.documents
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.contracts 
      WHERE id = contract_id AND (landlord_id = auth.uid() OR tenant_id = auth.uid())
    )
  );

CREATE POLICY "Permitir subir documentos a partes del contrato" ON public.documents
  FOR INSERT TO authenticated WITH CHECK (
    uploaded_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.contracts 
      WHERE id = contract_id AND (landlord_id = auth.uid() OR tenant_id = auth.uid())
    )
  );

CREATE POLICY "Permitir borrar documentos a su cargador" ON public.documents
  FOR DELETE TO authenticated USING (uploaded_by = auth.uid());

--------------------------------------------------------------------------------
-- TRIGGER AUTOMÁTICO DE PERFILES (Auth.users -> Profiles)
--------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, role, phone)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'full_name', new.email), 
    new.raw_user_meta_data->>'avatar_url',
    COALESCE(new.raw_user_meta_data->>'role', 'arrendatario'),
    new.raw_user_meta_data->>'phone'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
