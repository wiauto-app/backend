import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import {
  DealershipMember,
  PrimitiveDealershipMember,
} from "../../domain/entities/dealership-member";
import { DealershipMemberRepository } from "../../domain/repositories/dealership-member.repository";
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

@Injectable()
export class TypeOrmDealershipMemberRepository implements DealershipMemberRepository {
  constructor(
    @InjectRepository(DealershipMembersEntity)
    private readonly dealership_member_entity_repository: Repository<DealershipMembersEntity>,
  ) {}

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
}
