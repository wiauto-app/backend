import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import {
  DealershipMember,
  PrimitiveDealershipMember,
} from "../../domain/entities/dealership-member";
import { DealershipMemberRepository } from "../../domain/repositories/dealership-member.repository";
import {
  DealershipMemberDetail,
  DealershipMemberProfileSummary,
} from "../../domain/read-models/dealership-detail";
import { DealershipMembershipDetail } from "../../domain/read-models/dealership-membership-detail";
import { DealershipMembersEntity } from "../persistence/dealership-members.entity";

function entity_to_primitives(entity: DealershipMembersEntity): PrimitiveDealershipMember {
  return {
    id: entity.id,
    dealership_id: entity.dealership_id,
    profile_id: entity.profile_id,
    role: entity.role,
    created_at: entity.created_at,
    updated_at: entity.updated_at,
  };
}

function entity_to_member_detail(entity: DealershipMembersEntity): DealershipMemberDetail {
  const profile_summary: DealershipMemberProfileSummary = {
    id: entity.profile.id,
    name: entity.profile.name,
    last_name: entity.profile.last_name,
    avatar_url: entity.profile.avatar_url,
    email: entity.profile.user?.email ?? "",
  };

  return {
    id: entity.id,
    dealership_id: entity.dealership_id,
    profile_id: entity.profile_id,
    role: entity.role,
    created_at: entity.created_at,
    updated_at: entity.updated_at,
    profile: profile_summary,
  };
}

@Injectable()
export class TypeOrmDealershipMemberRepository implements DealershipMemberRepository {
  constructor(
    @InjectRepository(DealershipMembersEntity)
    private readonly dealership_member_entity_repository: Repository<DealershipMembersEntity>,
  ) {}

  async findOneById(id: string): Promise<DealershipMember | null> {
    const entity = await this.dealership_member_entity_repository.findOne({
      where: { id },
    });
    if (!entity) {
      return null;
    }

    return DealershipMember.fromPrimitives(entity_to_primitives(entity));
  }

  async findOwnerMemberByDealershipId(
    dealership_id: string,
    role?: "owner" | "admin" | "member",
  ): Promise<DealershipMember | null> {
    const entity = await this.dealership_member_entity_repository.findOne({
      where: {
        dealership_id,
        ...(role ? { role } : {}),
      },
    });
    if (!entity) {
      return null;
    }

    return DealershipMember.fromPrimitives(entity_to_primitives(entity));
  }

  async save(dealership_member: DealershipMember): Promise<void> {
    const p = dealership_member.toPrimitives();
    const entity = this.dealership_member_entity_repository.create({
      id: p.id,
      dealership_id: p.dealership_id,
      profile_id: p.profile_id,
      role: p.role,
      created_at: p.created_at,
      updated_at: p.updated_at,
    });

    await this.dealership_member_entity_repository.save(entity);
  }

  async update(dealership_member: DealershipMember): Promise<void> {
    const p = dealership_member.toPrimitives();
    const preloaded = await this.dealership_member_entity_repository.preload({
      id: p.id,
      dealership_id: p.dealership_id,
      profile_id: p.profile_id,
      role: p.role,
      created_at: p.created_at,
      updated_at: p.updated_at,
    });

    if (!preloaded) {
      return;
    }

    await this.dealership_member_entity_repository.save(preloaded);
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

  async findOneByProfileId(profile_id: string): Promise<DealershipMember | null> {
    const entity = await this.dealership_member_entity_repository.findOne({
      where: { profile_id },
    });

    if (!entity) {
      return null;
    }

    return DealershipMember.fromPrimitives(entity_to_primitives(entity));
  }

  async findOneByDealershipIdAndProfileId(
    dealership_id: string,
    profile_id: string,
  ): Promise<DealershipMember | null> {
    const entity = await this.dealership_member_entity_repository.findOne({
      where: {
        dealership_id,
        profile_id,
      },
    });

    if (!entity) {
      return null;
    }

    return DealershipMember.fromPrimitives(entity_to_primitives(entity));
  }

  async findAllByDealershipId(dealership_id: string): Promise<DealershipMemberDetail[]> {
    const entities = await this.dealership_member_entity_repository.find({
      where: { dealership_id },
      relations: {
        profile: {
          user: true,
        },
      },
    });

    return entities.map(entity_to_member_detail);
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
