export class CreateCallMeLeadDto {
  vehicle_id: string;
  name: string;
  phone: string;
  phone_code: string;
  callback_scheduled_at: string;
  buyer_profile_id?: string;
}
