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
  cuota: { id: string; name: string; slug: string; value: number } | null;
}
