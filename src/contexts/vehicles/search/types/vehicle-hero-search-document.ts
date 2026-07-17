export type VehicleHeroSearchDocument = {
  vehicle_id: string;
  status: string;
  deleted_at: string | null;
  make_id: number;
  make_slug: string;
  make_name: string;
  model_id: number;
  model_slug: string;
  model_name: string;
  province_id: number | null;
  province_slug: string | null;
  province_name: string | null;
  municipality_id: number | null;
  municipality_slug: string | null;
  municipality_name: string | null;
  active_price: number | null;
  location: { lat: number; lon: number } | null;
};
