export class CreateDealershipPayload {
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
  show_phone?: boolean;
}
