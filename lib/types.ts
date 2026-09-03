export interface FactoryLead {
  id?: string | number;
  place_id: string;
  name: string;
  company_name?: string;
  address: string;
  road?: string;
  district: string;
  subdistrict: string;
  province: string;
  postal_code?: string;
  phone?: string;
  website?: string;
  email?: string;
  lat: number;
  lng: number;
  maps_url?: string;
  rating?: number;
  user_ratings_total?: number;
  status?: any;
  sales_rep?: string | null;
  contact_person?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: any;
}

export type LeadStatus = 'NEW' | 'CONTACTED' | 'MEETING' | 'QUOTED' | 'WON' | 'LOST';
export type SalesStatus = LeadStatus;
export type UserRole = 'owner' | 'manager' | 'sales';

export interface LeadStatusRecord {
  status: LeadStatus;
  note?: string;
  updatedAt?: string;
  updatedByName?: string;
}

export interface Company {
  id: string;
  name: string;
  branch?: string;
  tax_id?: string | null;
  phone?: string | null;
  address?: string | null;
  contact_person?: string;
  lat?: number;
  lng?: number;
  radius_km?: number;
  subscription_tier?: 'starter' | 'pro' | 'enterprise' | string;
  max_seats?: number;
  invite_code?: string | null;
  created_at?: string;
  updated_at?: string;
}

export type CompanyProfile = Company;

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  phone?: string | null;
  role: UserRole;
  company_id?: string | null;
  company_name?: string | null;
  company?: Company | null;
  company_address?: string | null;
  company_phone?: string | null;
  company_lat?: number;
  company_lng?: number;
  company_radius_km?: number;
  subscription_tier?: string;
  created_at?: string;
  updated_at?: string;
}

export interface FilterState {
  search: string;
  district: string;
  subdistrict: string;
  hasPhone: boolean;
  hasEmail: boolean;
  hasWeb: boolean;
  minRating: number;
  status?: string;
  category?: string;
}
