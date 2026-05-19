import { PublisherType, StatusVehicle } from "../entities/vehicle";

/**
 * Proyección de listado: datos necesarios para la API, sin el agregado completo.
 */
export interface VehicleListItem {
  id: string;
  price: number;
  mileage: number;
  lat: number;
  lng: number;
  condition: string;
  title: string;
  created_at: Date;
  images: { id: string; url: string }[];
  features: { id: string; name: string; slug: string }[];
  services: { id: string; name: string; slug: string }[];
  vehicle_type: { id: string; name: string; slug: string } | null;
  color: { id: string; name: string; slug: string; hex_code: string } | null;
  dgt_label: { id: string; name: string; code: string; slug: string } | null;
  warranty_type: { id: string; name: string; slug: string } | null;
  cuotas: { id: string; name: string; slug: string; value: number }[];
  publisher:{
    id:string;
    name:string;
    avatar_url:string;
  }
}


export interface AdminVehicleListItem extends VehicleListItem {
  status: StatusVehicle;
  publisher_type: PublisherType;
  is_featured: boolean;
  expires_at: Date;
  views: number;
  created_at: Date;
  updated_at: Date;
}