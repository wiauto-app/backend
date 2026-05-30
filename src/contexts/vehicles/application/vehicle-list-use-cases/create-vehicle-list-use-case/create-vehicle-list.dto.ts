export class CreateVehicleListDto {
  profile_id: string;
  name: string;
  description?: string | null;
  is_default?: boolean;
}
