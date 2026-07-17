export interface VehicleListItemPreview {
  id: string;
  version_summary: {
    make_name: string;
    model_name: string;
    version_name: string;
  };
  price: number;
  image_url: string | null;
  created_at: Date;
  condition: string;
  is_featured: boolean;
  category: { id: string; name: string } | null;
  publisher_id: string;
  publisher_name: string;
  previous_price: number | null;
  price_change: number | null;
}

export interface VehicleListDetailItem {
  id: string;
  vehicle_list_id: string;
  vehicle_id: string;
  created_at: Date;
  vehicle: VehicleListItemPreview;
}

export interface VehicleListDetail {
  id: string;
  profile_id: string;
  is_default: boolean;
  name: string;
  description: string | null;
  created_at: Date;
  items: VehicleListDetailItem[];
}
