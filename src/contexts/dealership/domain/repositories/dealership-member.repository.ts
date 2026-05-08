import { DealershipMember } from "../entities/dealership-member";


export abstract class DealershipMemberRepository {
  abstract save(dealership_member: DealershipMember): Promise<void>;
  abstract existsByDealershipIdAndProfileId(
    dealership_id: string,
    profile_id: string,
  ): Promise<boolean>;
}