import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { PaginatedResult } from "@/src/contexts/shared/domain/value-objects/paginated-result.vo";

import { Dealership, PrimitiveDealership } from "../../domain/entities/dealership";
import { DealershipsFilter } from "../../domain/filters/dealerships.filter";
import { DealershipRepository } from "../../domain/repositories/dealership.repository";
import { DealershipAdminList } from "../../domain/read-models/dealership-admin-list";
import { DealershipEntity } from "../persistence/dealership.entity";
import { DealershipMembersEntity } from "../persistence/dealership-members.entity";
import { DealershipReviewEntity } from "../persistence/dealership-review.entity";
import { getSkip } from "@/src/contexts/shared/getSkip";

const dealership_order_columns = new Set([
  "id",
  "name",
  "slug",
  "email",
  "is_featured",
  "rating",
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
    lat: entity.lat != null ? Number(entity.lat) : undefined,
    lng: entity.lng != null ? Number(entity.lng) : undefined,
    is_featured: entity.is_featured,
    rating: entity.rating != null ? Number(entity.rating) : null,
    created_at: entity.created_at,
    updated_at: entity.updated_at,
  };
}

function raw_row_to_admin_list(row: Record<string, unknown>): DealershipAdminList {
  return {
    id: row.d_id as string,
    name: row.d_name as string,
    slug: row.d_slug as string,
    avatar_url: row.d_avatar_url as string | undefined,
    banner_url: row.d_banner_url as string | undefined,
    description: row.d_description as string,
    website_url: row.d_website_url as string | undefined,
    email: row.d_email as string,
    phone_code: row.d_phone_code as string,
    phone: row.d_phone as string,
    address: row.d_address as string,
    lat: row.d_lat != null ? Number(row.d_lat) : undefined,
    lng: row.d_lng != null ? Number(row.d_lng) : undefined,
    is_featured: Boolean(row.d_is_featured),
    rating: row.d_rating != null ? Number(row.d_rating) : null,
    created_at: row.d_created_at as Date,
    updated_at: row.d_updated_at as Date,
    members_count: Number(row.members_count ?? 0),
    reviews_count: Number(row.reviews_count ?? 0),
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
      is_featured: p.is_featured,
      rating: p.rating,
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

  async findAll(
    filter: DealershipsFilter,
  ): Promise<PaginatedResult<DealershipAdminList>> {
    const count_qb = this.dealership_entity_repository.createQueryBuilder("d");

    if (filter.name) {
      count_qb.andWhere("d.name ILIKE :name", { name: `%${filter.name}%` });
    }
    if (filter.slug) {
      count_qb.andWhere("d.slug ILIKE :slug", { slug: `%${filter.slug}%` });
    }
    if (filter.email) {
      count_qb.andWhere("d.email ILIKE :email", { email: `%${filter.email}%` });
    }
    if (filter.is_featured !== undefined) {
      count_qb.andWhere("d.is_featured = :is_featured", {
        is_featured: filter.is_featured,
      });
    }
    if (filter.query) {
      const q = `%${filter.query}%`;
      count_qb.andWhere(
        "(d.name ILIKE :q OR d.slug ILIKE :q OR d.email ILIKE :q OR d.description ILIKE :q)",
        { q },
      );
    }

    const total = await count_qb.getCount();

    const members_subquery = count_qb
      .subQuery()
      .select("COUNT(m.id)")
      .from(DealershipMembersEntity, "m")
      .where("m.dealership_id = d.id")
      .getQuery();

    const reviews_subquery = count_qb
      .subQuery()
      .select("COUNT(r.id)")
      .from(DealershipReviewEntity, "r")
      .where("r.dealership_id = d.id")
      .getQuery();

    const order_column =
      filter.order_by && dealership_order_columns.has(filter.order_by)
        ? filter.order_by
        : "created_at";
    const direction = filter.order_direction;

    const data_qb = count_qb
      .select("d.id", "d_id")
      .addSelect("d.name", "d_name")
      .addSelect("d.slug", "d_slug")
      .addSelect("d.avatar_url", "d_avatar_url")
      .addSelect("d.banner_url", "d_banner_url")
      .addSelect("d.description", "d_description")
      .addSelect("d.website_url", "d_website_url")
      .addSelect("d.email", "d_email")
      .addSelect("d.phone_code", "d_phone_code")
      .addSelect("d.phone", "d_phone")
      .addSelect("d.address", "d_address")
      .addSelect("d.lat", "d_lat")
      .addSelect("d.lng", "d_lng")
      .addSelect("d.is_featured", "d_is_featured")
      .addSelect("d.rating", "d_rating")
      .addSelect("d.created_at", "d_created_at")
      .addSelect("d.updated_at", "d_updated_at")
      .addSelect(`(${members_subquery})`, "members_count")
      .addSelect(`(${reviews_subquery})`, "reviews_count")
      .orderBy("d.is_featured", "DESC")
      .addOrderBy("d.rating", "DESC", "NULLS LAST")
      .addOrderBy(`d.${order_column}`, direction)
      .offset(getSkip(filter.page, filter.limit))
      .limit(filter.limit);

    const rows = await data_qb.getRawMany();
    const data = rows.map((row) => raw_row_to_admin_list(row));

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
      is_featured: p.is_featured,
      created_at: p.created_at,
      updated_at: p.updated_at,
    });
    if (!preloaded) {
      return;
    }
    await this.dealership_entity_repository.save(preloaded);
  }

  async updateRating(dealership_id: string, rating: number | null): Promise<void> {
    const preloaded = await this.dealership_entity_repository.preload({
      id: dealership_id,
      rating,
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
