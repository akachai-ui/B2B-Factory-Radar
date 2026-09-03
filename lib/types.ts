export interface FactoryLead {
  id?: string | number;
  place_id: string;
  name: string;
  address: string;
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
  contact_person?: string;
  notes?: string;
  created_at?: string;
}

export type LeadStatus = 'NEW' | 'CONTACTED' | 'MEETING' | 'QUOTED' | 'WON' | 'LOST';
export type SalesStatus = any;

export interface LeadStatusRecord {
  status: LeadStatus;
  note?: string;
  updatedAt: string;
}

export interface CompanyProfile {
  id?: string | number;
  name: string;
  branch?: string;
  address: string;
  phone: string;
  contact_person: string;
  lat: number;
  lng: number;
  radius_km: number;
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
