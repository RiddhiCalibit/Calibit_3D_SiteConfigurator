export interface User {
  id: string;
  tenant_id: string | null;
  email: string;
  role: 'platform_admin' | 'tenant_admin' | 'sales_rep';
  name: string;
  phone?: string;
  force_password_change?: number;
}
export interface Tenant {
  id: string;
  name: string;
  logo_url?: string;
  primary_color?: string;
  subscription_tier?: string;
  created_at?: string;
}