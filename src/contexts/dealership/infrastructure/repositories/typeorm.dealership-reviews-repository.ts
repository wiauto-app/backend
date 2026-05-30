import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { PaginatedResult } from "@/src/contexts/shared/domain/value-objects/paginated-result.vo";
import { InjectRepository } from "@nestjs/typeorm";
import { NotFoundException } from "@nestjs/common";
import { Repository } from "typeorm";

import { DealershipReview } from "../../domain/entities/dealership-review";
import { DealershipReviewFilter } from "../../domain/filters/dealership-review.filter";
import { DealershipReviewsRepository } from "../../domain/repositories/dealership-reviews.repository";
import { DealershipReviewEntity } from "../persistence/dealership-review.entity";

const list_order_columns = new Set(["id", "rating", "created_at", "updated_at"]);

@Injectable()
export class TypeOrmDealershipReviewsRepository implements DealershipReviewsRepository {
  constructor(
    @InjectRepository(DealershipReviewEntity)
    private readonly dealership_review_repository: Repository<DealershipReviewEntity>,
  ) {}

  async save(review: DealershipReview): Promise<void> {
    const primitive = review.toPrimitives();
    await this.dealership_review_repository.save(
      this.dealership_review_repository.create(primitive),
    );
  }

  async update(review: DealershipReview): Promise<void> {
    const primitive = review.toPrimitives();
    const merged = await this.dealership_review_repository.preload({
      id: primitive.id,
      rating: primitive.rating,
      comment: primitive.comment,
      profile_id: primitive.profile_id,
      dealership_id: primitive.dealership_id,
      updated_at: primitive.updated_at,
    });
    if (!merged) {
      throw new NotFoundException("Reseña de concesionario no encontrada");
    }
    await this.dealership_review_repository.save(merged);
  }

  async remove(id: string): Promise<void> {
    await this.dealership_review_repository.delete(id);
  }

  async find_all(
    filter: DealershipReviewFilter,
  ): Promise<PaginatedResult<DealershipReview>> {
    const qb = this.dealership_review_repository
      .createQueryBuilder("r")
      .where("r.dealership_id = :dealership_id", {
        dealership_id: filter.dealership_id,
      });

    if (filter.profile_id) {
      qb.andWhere("r.profile_id = :profile_id", { profile_id: filter.profile_id });
    }
    if (filter.created_since) {
      qb.andWhere("r.created_at >= :created_since", {
        created_since: filter.created_since,
      });
    }
    if (filter.created_until) {
      qb.andWhere("r.created_at <= :created_until", {
        created_until: filter.created_until,
      });
    }
    if (filter.query?.trim()) {
      qb.andWhere("r.comment ILIKE :query", { query: `%${filter.query.trim()}%` });
    }

    const order_column =
      filter.order_by !== undefined && list_order_columns.has(filter.order_by)
        ? filter.order_by
        : "created_at";
    const direction = filter.order_direction;
    qb.orderBy(`r.${order_column}`, direction);

    const [rows, total] = await qb.getManyAndCount();
    const data = rows.map((row) => DealershipReview.fromPrimitives(row));
    return new PaginatedResult(data, total, filter.page, filter.limit);
  }

  async find_one(id: string): Promise<DealershipReview | null> {
    const row = await this.dealership_review_repository.findOne({ where: { id } });
    return row ? DealershipReview.fromPrimitives(row) : null;
  }
}
