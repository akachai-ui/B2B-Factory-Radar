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

export interface TeamInvitation {
  id: string;
  company_id: string;
  company_name: string;
  email: string;
  role: 'sales' | 'manager';
  invited_by?: string;
  status: 'pending' | 'accepted' | 'declined' | 'canceled';
  created_at?: string;
  updated_at?: string;
}

export type CompanyProfile = Company;

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string | null;
  account_type?: 'individual' | 'company';
  company_name?: string | null;
  tax_id?: string | null;
  branch?: string | null;
  phone?: string | null;
  onboarded?: boolean;
  role: UserRole;
  status?: 'active' | 'inactive';
  company_id?: string | null;
  company?: Company | null;
  company_address?: string | null;
  company_phone?: string | null;
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

export interface DBDCompany {
  id: number | string;
  tax_id: string;
  name: string;
  registered_capital: number;
  tsic_code?: string;
  objective?: string;
  address?: string;
  subdistrict?: string;
  district?: string;
  province?: string;
  postal_code?: string;
  registration_date?: string;
  dissolution_date?: string | null;
  status: 'ACTIVE' | 'DISSOLVED' | string;
  lat: number;
  lng: number;
  created_at?: string;
}

export interface DBDFilterState {
  search: string;
  province: string;
  district: string;
  capitalRange: 'ALL' | '<5M' | '5M-20M' | '20M-50M' | '>50M' | '>100M';
  tsicCategory: string;
  status: 'ACTIVE' | 'ALL';
}

export type DatasetMode = 'factories' | 'dbd';

export interface CompanyLead {
  id: string;
  company_id: string;
  user_id?: string | null;
  claimed_by?: string | null;
  source_type: 'dbd' | 'factory_radar' | 'manual' | string;
  dbd_id?: number | string | null;
  lead_id?: number | string | null;
  place_id?: string | null;
  company_name: string;
  tax_id?: string | null;
  registered_capital?: number;
  tsic_code?: string | null;
  objective?: string | null;
  address?: string | null;
  subdistrict?: string | null;
  district?: string | null;
  province?: string | null;
  postal_code?: string | null;
  lat?: number | null;
  lng?: number | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  contact_person?: string | null;
  status: LeadStatus | string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' | string;
  deal_value?: number;
  notes?: string | null;
  last_activity_at?: string;
  created_at: string;
  updated_at: string;
  sales_rep_name?: string | null;
  sales_rep_email?: string | null;
  sales_rep_avatar?: string | null;
}

export type TripCheckinType = 'CLIENT_VISIT' | 'LUNCH_BREAK' | 'GAS_STATION' | 'OTHER';

export interface TripCheckin {
  id: string;
  trip_id: string;
  company_id: string;
  user_id: string;
  company_lead_id?: string | null;
  checkin_type: TripCheckinType;
  location_name: string;
  lat: number;
  lng: number;
  distance_from_prev_km: number;
  photo_url?: string | null;
  notes?: string | null;
  checkin_time: string;
}

export type TripStatus = 'in_progress' | 'completed' | 'approved' | 'rejected';

export interface VehicleTrip {
  id: string;
  company_id: string;
  user_id: string;
  user_name?: string | null;
  user_email?: string | null;
  user_avatar?: string | null;
  trip_date: string;
  vehicle_type: 'car' | 'motorcycle' | 'van' | string;
  license_plate?: string | null;
  
  start_odometer: number;
  start_photo_url?: string | null;
  start_time: string;
  start_lat?: number | null;
  start_lng?: number | null;
  start_location_name?: string | null;
  
  end_odometer?: number | null;
  end_photo_url?: string | null;
  end_time?: string | null;
  end_lat?: number | null;
  end_lng?: number | null;
  end_location_name?: string | null;
  
  total_odometer_km?: number | null;
  total_route_km: number;
  personal_deduct_km: number;
  net_claimable_km?: number | null;
  
  fuel_rate_per_km: number;
  total_fuel_amount?: number | null;
  
  status: TripStatus;
  approved_by?: string | null;
  approver_name?: string | null;
  approved_at?: string | null;
  rejection_reason?: string | null;
  notes?: string | null;
  
  created_at: string;
  updated_at: string;
  checkins?: TripCheckin[];
}

export type FuelCalculationMode = 'odometer' | 'gps_route' | 'min_rule';

export interface CompanyFuelPolicy {
  id?: string;
  company_id: string;
  car_rate_per_km: number;
  motorcycle_rate_per_km: number;
  van_rate_per_km: number;
  calculation_mode: FuelCalculationMode;
  variance_tolerance_pct: number;
  require_photo_odometer: boolean;
  require_client_checkin: boolean;
  allow_sales_override_rate: boolean;
  created_at?: string;
  updated_at?: string;
}


