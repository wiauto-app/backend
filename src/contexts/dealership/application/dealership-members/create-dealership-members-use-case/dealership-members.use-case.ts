import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { DealershipMemberRepository } from "@/src/contexts/dealership/domain/repositories/dealership-member.repository";
import { DealershipMember } from "../../../domain/entities/dealership-member";
import { CreateDealershipMembersDto } from "./dealership-members.dto";

@Injectable()
export class CreateDealershipMembersUseCase {
  constructor(
    private readonly dealership_member_repository: DealershipMemberRepository,
  ) {}

  async execute(create_dealership_members_dto: CreateDealershipMembersDto): Promise<void> {
    const dealership_member = DealershipMember.create(create_dealership_members_dto);
    await this.dealership_member_repository.save(dealership_member);
  }
}