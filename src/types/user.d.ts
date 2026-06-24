export interface User {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  role: 'admin' | 'landlord' | 'tenant';
  created_at: string;
}