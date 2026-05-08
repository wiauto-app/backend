import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { PaginatedResult } from "@/src/contexts/shared/domain/value-objects/paginated-result.vo";

import { Dealership, PrimitiveDealership } from "../../domain/entities/dealership";
import { DealershipsFilter } from "../../domain/filters/dealerships.filter";
import { DealershipRepository } from "../../domain/repositories/dealership.repository";
import { DealershipEntity } from "../persistence/dealership.entity";

const dealership_order_columns = new Set([
  "id",
  "name",
  "slug",
  "email",
  "created_at",
  "updated_at",
]);

function entity_to_primitives(entity: DealershipEntity): PrimitiveDealership {
  return {
    id: entity.id,
    name: entity.name,
    slug: entity.slug,
    avatar_url: entity.avatar_url,
    banner_url: entity.banner_url,
    description: entity.description,
    website_url: entity.website_url,
    email: entity.email,
    phone_code: entity.phone_code,
    phone: entity.phone,
    address: entity.address,
    lat: Number(entity.lat),
    lng: Number(entity.lng),
    created_at: entity.created_at,
    updated_at: entity.updated_at,
  };
}

@Injectable()
export class TypeOrmDealershipRepository implements DealershipRepository {
  constructor(
    @InjectRepository(DealershipEntity)
    private readonly dealership_entity_repository: Repository<DealershipEntity>,
  ) {}

  async save(dealership: Dealership): Promise<void> {
    const p = dealership.toPrimitives();
    const entity = this.dealership_entity_repository.create({
      id: p.id,
      name: p.name,
      slug: p.slug,
      avatar_url: p.avatar_url,
      banner_url: p.banner_url,
      description: p.description,
      website_url: p.website_url,
      email: p.email,
      phone_code: p.phone_code,
      phone: p.phone,
      address: p.address,
      lat: p.lat,
      lng: p.lng,
      created_at: p.created_at,
      updated_at: p.updated_at,
    });
    await this.dealership_entity_repository.save(entity);
  }

  async findOne(id: string): Promise<Dealership | null> {
    const entity = await this.dealership_entity_repository.findOne({ where: { id } });
    if (!entity) {
      return null;
    }
    return Dealership.fromPrimitives(entity_to_primitives(entity));
  }

  async findAll(filter: DealershipsFilter): Promise<PaginatedResult<Dealership>> {
    const qb = this.dealership_entity_repository.createQueryBuilder("d");

    if (filter.name) {
      qb.andWhere("d.name ILIKE :name", { name: `%${filter.name}%` });
    }
    if (filter.slug) {
      qb.andWhere("d.slug ILIKE :slug", { slug: `%${filter.slug}%` });
    }
    if (filter.email) {
      qb.andWhere("d.email ILIKE :email", { email: `%${filter.email}%` });
    }
    if (filter.query) {
      const q = `%${filter.query}%`;
      qb.andWhere(
        "(d.name ILIKE :q OR d.slug ILIKE :q OR d.email ILIKE :q OR d.description ILIKE :q)",
        { q },
      );
    }

    const order_column =
      filter.order_by && dealership_order_columns.has(filter.order_by)
        ? filter.order_by
        : "created_at";
    const direction = (filter.order_direction ?? "desc").toUpperCase() as "ASC" | "DESC";

    qb.orderBy(`d.${order_column}`, direction);
    qb.skip(filter.skip);
    qb.take(filter.limit);

    const [rows, total] = await qb.getManyAndCount();
    const data = rows.map((row) => Dealership.fromPrimitives(entity_to_primitives(row)));
    return new PaginatedResult(data, total, filter.page, filter.limit);
  }

  async update(dealership: Dealership): Promise<void> {
    const p = dealership.toPrimitives();
    const preloaded = await this.dealership_entity_repository.preload({
      id: p.id,
      name: p.name,
      slug: p.slug,
      avatar_url: p.avatar_url,
      banner_url: p.banner_url,
      description: p.description,
      website_url: p.website_url,
      email: p.email,
      phone_code: p.phone_code,
      phone: p.phone,
      address: p.address,
      lat: p.lat,
      lng: p.lng,
      created_at: p.created_at,
      updated_at: p.updated_at,
    });
    if (!preloaded) {
      return;
    }
    await this.dealership_entity_repository.save(preloaded);
  }

  async delete(id: string): Promise<void> {
    await this.dealership_entity_repository.delete(id);
  }
}
