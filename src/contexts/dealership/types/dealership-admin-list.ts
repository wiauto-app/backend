

export interface DealershipAdminList {
  id: string;
  name: string;
  slug: string;
  avatar_url?: string;
  banner_url?: string;
  description: string;
  website_url?: string;
  email: string;
  phone_code: string;
  phone: string;
  address: string;
  lat?: number;
  lng?: number;
  is_featured: boolean;
  rating: number | null;
  created_at: Date;
  updated_at: Date;
  members_count: number;
  reviews_count: number;
  vehicles_count: number;
}