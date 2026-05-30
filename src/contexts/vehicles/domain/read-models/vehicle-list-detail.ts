export interface VehicleListItemPreview {
  id: string;
  title: string;
  price: number;
  image_url: string | null;
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
