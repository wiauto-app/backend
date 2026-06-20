import { DealershipMember } from "../entities/dealership-member";
import { DealershipMemberDetail } from "../read-models/dealership-detail";
import { DealershipMembershipDetail } from "../read-models/dealership-membership-detail";

export abstract class DealershipMemberRepository {
  abstract save(dealership_member: DealershipMember): Promise<void>;

  abstract update(dealership_member: DealershipMember): Promise<void>;

  abstract remove(id: string): Promise<void>;

  abstract findOneById(id: string): Promise<DealershipMember | null>;

  abstract findOneByProfileId(profile_id: string): Promise<DealershipMember | null>;

  abstract findOneByDealershipIdAndProfileId(
    dealership_id: string,
    profile_id: string,
  ): Promise<DealershipMember | null>;

  abstract findOwnerMemberByDealershipId(
    dealership_id: string,
    role?: "owner" | "admin" | "member",
  ): Promise<DealershipMember | null>;

  abstract existsByDealershipIdAndProfileId(
    dealership_id: string,
    profile_id: string,
  ): Promise<boolean>;

  abstract findAllByDealershipId(dealership_id: string): Promise<DealershipMemberDetail[]>;

  abstract findMembershipDetailByProfileId(
    profile_id: string,
  ): Promise<DealershipMembershipDetail | null>;
}
