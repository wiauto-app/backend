import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { DealershipMembershipDetail } from "../types/dealership-membership-detail";
import { DealershipMembersEntity } from "../entities/dealership-members.entity";

export type CreateDealershipMember = Pick<
  DealershipMembersEntity,
  "dealership_id" | "profile_id" | "role"
>;

@Injectable()
export class TypeOrmDealershipMemberRepository {
  constructor(
    @InjectRepository(DealershipMembersEntity)
    private readonly dealership_member_entity_repository: Repository<DealershipMembersEntity>,
  ) {}

  async findOneById(id: string): Promise<DealershipMembersEntity | null> {
    return this.dealership_member_entity_repository.findOne({
      where: { id },
      relations: {
        profile: {
          user: true,
        },
      },
    });
  }

  async findOwnerMemberByDealershipId(
    dealership_id: string,
    role?: "owner" | "admin" | "member",
  ): Promise<DealershipMembersEntity | null> {
    return this.dealership_member_entity_repository.findOne({
      where: {
        dealership_id,
        ...(role ? { role } : {}),
      },
    });
  }

  async save(dealership_member: CreateDealershipMember): Promise<void> {
    const entity =
      this.dealership_member_entity_repository.create(dealership_member);

    await this.dealership_member_entity_repository.save(entity);
  }

  async updateRole(
    id: string,
    role: DealershipMembersEntity["role"],
  ): Promise<void> {
    await this.dealership_member_entity_repository.update(id, { role });
  }

  async remove(id: string): Promise<void> {
    await this.dealership_member_entity_repository.delete(id);
  }

  async existsByDealershipIdAndProfileId(
    dealership_id: string,
    profile_id: string,
  ): Promise<boolean> {
    return this.dealership_member_entity_repository.exists({
      where: {
        dealership_id,
        profile_id,
      },
    });
  }

  async findOneByProfileId(
    profile_id: string,
  ): Promise<DealershipMembersEntity | null> {
    return this.dealership_member_entity_repository.findOne({
      where: { profile_id },
      relations: {
        profile: {
          user: true,
        },
      },
    });
  }

  async findOneByDealershipIdAndProfileId(
    dealership_id: string,
    profile_id: string,
  ): Promise<DealershipMembersEntity | null> {
    return this.dealership_member_entity_repository.findOne({
      where: {
        dealership_id,
        profile_id,
      },
    });
  }

  async findAllByDealershipId(
    dealership_id: string,
  ): Promise<DealershipMembersEntity[]> {
    return this.dealership_member_entity_repository.find({
      where: { dealership_id },
      relations: {
        profile: {
          user: true,
        },
      },
    });
  }

  async findMembershipDetailByProfileId(
    profile_id: string,
  ): Promise<DealershipMembershipDetail | null> {
    const entity = await this.dealership_member_entity_repository.findOne({
      where: { profile_id },
      relations: { dealership: true },
    });

    if (!entity) {
      return null;
    }

    return {
      dealership_id: entity.dealership_id,
      dealership_name: entity.dealership.name,
      member_id: entity.id,
      role: entity.role,
    };
  }
}
