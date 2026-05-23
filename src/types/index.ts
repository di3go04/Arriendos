export interface Profile {
  id: string;
  full_name: string | null;
  phone: string | null;
  role: 'arrendador' | 'arrendatario' | 'admin';
  avatar_url: string | null;
  preferred_currency: string;
  reminder_days_before: number;
  timezone: string;
  created_at: string;
}

export type PropertyInsert = Omit<Property, 'id' | 'owner_id' | 'created_at'>;

export interface Property {
  id: string;
  owner_id: string;
  title: string;
  type: 'casa' | 'apartamento' | 'local' | 'oficina' | 'terreno';
  address: string | null;
  city: string | null;
  area_sqm: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  description: string | null;
  amenities: string[];
  monthly_rent: number;
  deposit: number;
  available_from: string | null;
  status: 'disponible' | 'ocupado' | 'mantenimiento' | 'inactivo';
  image_urls: string[];
  created_at: string;
}

export interface ContractTemplate {
  id: string;
  owner_id: string | null;
  name: string;
  content: string; // HTML body with placeholders {{variable}} or spans with data-campo
  variables: string[]; // List of placeholder tags
  is_public: boolean;
  tipo: string; // 'manual' | 'ai'
  created_at: string;
}

export interface Contract {
  id: string;
  property_id: string;
  landlord_id: string;
  tenant_id: string;
  template_id: string | null;
  contract_number: string | null;
  status: 'borrador' | 'pendiente_firma' | 'firmado' | 'activo' | 'finalizado' | 'cancelado';
  start_date: string;
  end_date: string | null;
  monthly_rent: number;
  deposit: number;
  payment_day: number;
  notes: string | null;
  contract_content: string | null; // Compilated final HTML
  pdf_url: string | null;
  signed_by_landlord: boolean;
  signed_by_tenant: boolean;
  landlord_signed_at: string | null;
  tenant_signed_at: string | null;
  created_at: string;

  // Joins
  property?: Property;
  landlord?: Profile;
  tenant?: Profile;
  template?: ContractTemplate;
  payments?: Payment[];
  documents?: Document[];
}

export interface Payment {
  id: string;
  contract_id: string;
  tenant_id: string;
  amount: number;
  due_date: string;
  paid: boolean;
  paid_at: string | null;
  payment_method: string | null;
  receipt_url: string | null;
  month_year: string | null;
  status: string | null;
  stripe_payment_id: string | null;
  notes: string | null;
  created_at: string;

  // Joins
  contract?: Contract & { property: Property; landlord: Profile; tenant: Profile };
}

export interface MaintenanceIssue {
  id: string;
  property_id: string;
  user_id: string; // Reported by user
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'resolved';
  estimated_cost: number;
  vendor: string | null;
  notes: string | null;
  reported_date: string;
  resolved_date: string | null;
  created_at: string;

  // Joins
  property?: Property;
  user?: Profile;
}

export type NotificationType =
  | 'pago_proximo'
  | 'pago_vencido'
  | 'pago_validado'
  | 'pago_registrado'
  | 'contrato_pendiente_firma'
  | 'contrato_firmado'
  | 'contrato_proximo_vencer'
  | 'contrato_vencido'
  | 'info'
  | 'warning'
  | 'success'
  | 'danger';

export interface Notification {
  id: string;
  user_id: string;
  title: string | null;
  message: string | null;
  type: NotificationType | null;
  read: boolean;
  contract_id: string | null;
  created_at: string;
}

export interface Document {
  id: string;
  contract_id: string;
  uploaded_by: string | null;
  name: string | null;
  file_url: string | null;
  type: 'anexo' | 'inventario' | 'foto' | 'otro';
  created_at: string;

  // Joins
  contract?: Contract;
  uploader?: Profile;
}
