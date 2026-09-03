export interface FactoryLead {
  id?: string;
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
  created_at?: string;
}

export type LeadStatus = 'NEW' | 'CONTACTED' | 'MEETING' | 'WON' | 'LOST';

export interface LeadStatusRecord {
  status: LeadStatus;
  note?: string;
  updatedAt: string;
}

export interface CompanyProfile {
  name: string;
  address: string;
  phone: string;
  contact_person: string;
  lat: number;
  lng: number;
  radius_km: number;
}
