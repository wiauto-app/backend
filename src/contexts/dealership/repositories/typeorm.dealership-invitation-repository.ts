import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { PaginatedResult } from "@/src/contexts/shared/types/paginated-result.vo";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

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
  "updated_at",
]);

export type CreateDealershipInvitation = Pick<
  DealershipInvitationsEntity,
  | "email"
  | "role"
  | "token_hash"
  | "status"
  | "expires_at"
  | "accepted_at"
  | "dealership_id"
  | "invited_by_id"
>;

export type UpdateDealershipInvitation = Partial<
  Pick<DealershipInvitationsEntity, "status" | "accepted_at">
>;

@Injectable()
export class TypeOrmDealershipInvitationRepository {
  constructor(
    @InjectRepository(DealershipInvitationsEntity)
    private readonly dealership_invitation_entity_repository: Repository<DealershipInvitationsEntity>,
  ) {}

  async save(
    dealership_invitation: CreateDealershipInvitation,
  ): Promise<DealershipInvitationsEntity> {
    const entity = this.dealership_invitation_entity_repository.create(
      dealership_invitation,
    );

    return this.dealership_invitation_entity_repository.save(entity);
  }

  async findOne(id: string): Promise<DealershipInvitationsEntity | null> {
    return this.dealership_invitation_entity_repository.findOne({
      where: { id },
    });
  }

  async findOneWithDealership(
    id: string,
  ): Promise<DealershipInvitationsEntity | null> {
    return this.dealership_invitation_entity_repository.findOne({
      where: { id },
      relations: { dealership: true },
    });
  }

  async findOneByTokenHash(
    token_hash: string,
  ): Promise<DealershipInvitationsEntity | null> {
    return this.dealership_invitation_entity_repository.findOne({
      where: { token_hash },
    });
  }

  async findAll(
    filter: DealershipInvitationsFilter,
  ): Promise<PaginatedResult<DealershipInvitationsEntity>> {
    const qb =
      this.dealership_invitation_entity_repository.createQueryBuilder("di");

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
      filter.order_by &&
      dealership_invitation_order_columns.has(filter.order_by)
        ? filter.order_by
        : "created_at";
    const direction = filter.order_direction;

    qb.orderBy(`di.${order_column}`, direction);
    qb.skip(getSkip(filter.page, filter.limit));
    qb.take(filter.limit);

    const [data, total] = await qb.getManyAndCount();

    return new PaginatedResult(data, total, filter.page, filter.limit);
  }

  async update(
    id: string,
    changes: UpdateDealershipInvitation,
  ): Promise<DealershipInvitationsEntity | null> {
    const preloaded =
      await this.dealership_invitation_entity_repository.preload({
        id,
        ...changes,
      });

    if (!preloaded) {
      return null;
    }

    return this.dealership_invitation_entity_repository.save(preloaded);
  }

  async delete(id: string): Promise<void> {
    await this.dealership_invitation_entity_repository.delete(id);
  }
  

  async deleteByEmail(email: string): Promise<void> {
    await this.dealership_invitation_entity_repository.delete({ email });
  }

  async findOneByEmail(
    email: string,
  ): Promise<DealershipInvitationsEntity | null> {
    return this.dealership_invitation_entity_repository.findOne({
      where: { email },
      order: { created_at: "DESC" },
    });
  }

  async findAcceptedByEmail(
    email: string,
  ): Promise<DealershipInvitationsEntity | null> {
    return this.dealership_invitation_entity_repository.findOne({
      where: {
        email,
        status: "accepted",
      },
      order: { accepted_at: "DESC" },
    });
  }

  async findPendingByEmailAndDealershipId(
    email: string,
    dealership_id: string,
  ): Promise<DealershipInvitationsEntity | null> {
    return this.dealership_invitation_entity_repository.findOne({
      where: {
        email,
        dealership_id,
        status: "pending",
      },
      order: { created_at: "DESC" },
    });
  }
}
