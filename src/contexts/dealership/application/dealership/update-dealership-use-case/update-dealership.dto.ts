import { DealershipMemberInputDto } from "../dealership-member-input.dto";

export class UpdateDealershipDto {
  id: string;
  name?: string;
  slug?: string;
  avatar_url?: string;
  banner_url?: string;
  description?: string;
  website_url?: string;
  email?: string;
  phone_code?: string;
  phone?: string;
  address?: string;
  lat?: number;
  lng?: number;
  members?: DealershipMemberInputDto[];
  is_featured?: boolean;
}
