import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { PaginatedResult } from "@/src/contexts/shared/types/paginated-result.vo";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import {
  DealershipInvitation,
  PrimitiveDealershipInvitation,
} from "../types/dealership-invitations";
import { DealershipInvitationsFilter } from "../types/dealership-invitation.filter";
import { DealershipInvitationsEntity } from "../entities/dealership-invitations.entity";
import { getSkip } from "@/src/contexts/shared/getSkip";

const dealership_invitation_order_columns = new Set([
  "id",
  "email",
  "role",
  "status",
  "expires_at",
  "accepted_at",
  "created_at",
  "updated_at"]);

function entity_to_primitives(
  entity: DealershipInvitationsEntity,
): PrimitiveDealershipInvitation {
  return {
    id: entity.id,
    email: entity.email,
    role: entity.role,
    token_hash: entity.token_hash,
    status: entity.status,
    expires_at: entity.expires_at,
    accepted_at: entity.accepted_at,
    created_at: entity.created_at,
    updated_at: entity.updated_at,
    invited_by_id: entity.invited_by_id,
    dealership_id: entity.dealership_id,
  };
}

@Injectable()
export class TypeOrmDealershipInvitationRepository {
  constructor(
    @InjectRepository(DealershipInvitationsEntity)
    private readonly dealership_invitation_entity_repository: Repository<DealershipInvitationsEntity>,
  ) {
  }

  async save(dealership_invitation: DealershipInvitation): Promise<void> {
    const p = dealership_invitation.toPrimitives();
    const entity = this.dealership_invitation_entity_repository.create({
      id: p.id,
      email: p.email,
      role: p.role,
      token_hash: p.token_hash,
      status: p.status,
      expires_at: p.expires_at,
      accepted_at: p.accepted_at,
      created_at: p.created_at,
      updated_at: p.updated_at,
      dealership_id: p.dealership_id,
      invited_by_id: p.invited_by_id,
    });

    await this.dealership_invitation_entity_repository.save(entity);
  }

  async findOne(id: string): Promise<DealershipInvitation | null> {
    const entity = await this.dealership_invitation_entity_repository.findOne({ where: { id } });
    if (!entity) {
      return null;
    }

    return DealershipInvitation.fromPrimitives(entity_to_primitives(entity));
  }

  async findOneByTokenHash(token_hash: string): Promise<DealershipInvitation | null> {
    const entity = await this.dealership_invitation_entity_repository.findOne({
      where: { token_hash },
    });
    if (!entity) {
      return null;
    }

    return DealershipInvitation.fromPrimitives(entity_to_primitives(entity));
  }

  async findAll(filter: DealershipInvitationsFilter): Promise<PaginatedResult<DealershipInvitation>> {
    const qb = this.dealership_invitation_entity_repository.createQueryBuilder("di");

    if (filter.dealership_id) {
      qb.andWhere("di.dealership_id = :dealership_id", {
        dealership_id: filter.dealership_id,
      });
    }
    if (filter.email) {
      qb.andWhere("di.email ILIKE :email", { email: `%${filter.email}%` });
    }
    if (filter.role) {
      qb.andWhere("di.role = :role", { role: filter.role });
    }
    if (filter.status) {
      qb.andWhere("di.status = :status", { status: filter.status });
    }
    if (filter.query) {
      qb.andWhere("(di.email ILIKE :q OR di.role ILIKE :q)", {
        q: `%${filter.query}%`,
      });
    }

    const order_column =
      filter.order_by && dealership_invitation_order_columns.has(filter.order_by)
        ? filter.order_by
        : "created_at";
    const direction = filter.order_direction;

    qb.orderBy(`di.${order_column}`, direction);
    qb.skip(getSkip(filter.page, filter.limit));
    qb.take(filter.limit);

    const [rows, total] = await qb.getManyAndCount();
    const data = rows.map((row) => DealershipInvitation.fromPrimitives(entity_to_primitives(row)));

    return new PaginatedResult(data, total, filter.page, filter.limit);
  }

  async update(dealership_invitation: DealershipInvitation): Promise<void> {
    const p = dealership_invitation.toPrimitives();
    const preloaded = await this.dealership_invitation_entity_repository.preload({
      id: p.id,
      email: p.email,
      role: p.role,
      token_hash: p.token_hash,
      status: p.status,
      expires_at: p.expires_at,
      accepted_at: p.accepted_at,
      created_at: p.created_at,
      updated_at: p.updated_at,
      dealership_id: p.dealership_id,
      invited_by_id: p.invited_by_id,
    });

    if (!preloaded) {
      return;
    }

    await this.dealership_invitation_entity_repository.save(preloaded);
  }

  async delete(id: string): Promise<void> {
    await this.dealership_invitation_entity_repository.delete(id);
  }

  async findOneByEmail(email: string): Promise<DealershipInvitation | null> {
    const entity = await this.dealership_invitation_entity_repository.findOne({
      where: { email },
      order: { created_at: "DESC" },
    });
    if (!entity) {
      return null;
    }

    return DealershipInvitation.fromPrimitives(entity_to_primitives(entity));
  }

  async findAcceptedByEmail(email: string): Promise<DealershipInvitation | null> {
    const entity = await this.dealership_invitation_entity_repository.findOne({
      where: {
        email,
        status: "accepted",
      },
      order: { accepted_at: "DESC" },
    });
    if (!entity) {
      return null;
    }

    return DealershipInvitation.fromPrimitives(entity_to_primitives(entity));
  }

  async findPendingByEmailAndDealershipId(
    email: string,
    dealership_id: string,
  ): Promise<DealershipInvitation | null> {
    const entity = await this.dealership_invitation_entity_repository.findOne({
      where: {
        email,
        dealership_id,
        status: "pending",
      },
      order: { created_at: "DESC" },
    });
    if (!entity) {
      return null;
    }

    return DealershipInvitation.fromPrimitives(entity_to_primitives(entity));
  }
}