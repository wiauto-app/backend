export class CreateLeadDto {
  vehicle_id: string;
  name: string;
  email: string;
  phone?: string;
  phone_code?: string;
  message: string;
  buyer_profile_id?: string;
}
