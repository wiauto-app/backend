export class UpdateVehicleListDto {
  list_id: string;
  profile_id: string;
  name?: string;
  description?: string | null;
  is_default?: boolean;
}
