import { DealershipMemberInputDto } from "../../dealership/dealership-member-input.dto";

export class SyncDealershipMembersDto {
  dealership_id: string;
  members: DealershipMemberInputDto[];
}
