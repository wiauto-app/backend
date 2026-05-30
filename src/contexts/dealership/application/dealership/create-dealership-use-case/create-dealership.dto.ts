import { DealershipMemberInputDto } from "../dealership-member-input.dto";

/** DTO de aplicación: no debe depender de tipos del dominio. */
export class CreateDealershipDto {
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
  members: DealershipMemberInputDto[];
}
