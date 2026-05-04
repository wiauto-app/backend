import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { PaginatedResult } from "@/src/contexts/shared/domain/value-objects/paginated-result.vo";
import { InjectRepository } from "@nestjs/typeorm";
import { NotFoundException } from "@nestjs/common";
import { Repository } from "typeorm";

import { Review } from "../../domain/entities/reviews";
import { ReviewFilter } from "../../domain/filters/review.filter";
import { ReviewsRepository } from "../../domain/repositories/reviews.repository";
import { ReviewEntity } from "../persistence/review.entity";

const list_order_columns = new Set(["id", "rating", "created_at", "updated_at"]);

@Injectable()
export class TypeormReviewsRepository implements ReviewsRepository {
  constructor(
    @InjectRepository(ReviewEntity)
    private readonly review_repository: Repository<ReviewEntity>,
  ) {}

  async save(review: Review): Promise<void> {
    const primitive = review.toPrimitives();
    await this.review_repository.save(this.review_repository.create(primitive));
  }

  async update(review: Review): Promise<void> {
    const primitive = review.toPrimitives();
    const merged = await this.review_repository.preload({
      id: primitive.id,
      rating: primitive.rating,
      comment: primitive.comment,
      profile_id: primitive.profile_id,
      vehicle_id: primitive.vehicle_id,
      updated_at: primitive.updated_at,
    });
    if (!merged) {
      throw new NotFoundException("Reseña no encontrada");
    }
    await this.review_repository.save(merged);
  }

  async remove(id: string): Promise<void> {
    await this.review_repository.delete(id);
  }

  async find_all(filter: ReviewFilter): Promise<PaginatedResult<Review>> {
    const qb = this.review_repository
      .createQueryBuilder("r")
      .where("r.vehicle_id = :vehicle_id", { vehicle_id: filter.vehicle_id });

    if (filter.profile_id) {
      qb.andWhere("r.profile_id = :profile_id", { profile_id: filter.profile_id });
    }
    if (filter.created_since) {
      qb.andWhere("r.created_at >= :created_since", { created_since: filter.created_since });
    }
    if (filter.created_until) {
      qb.andWhere("r.created_at <= :created_until", { created_until: filter.created_until });
    }
    if (filter.query?.trim()) {
      qb.andWhere("r.comment ILIKE :query", { query: `%${filter.query.trim()}%` });
    }

    const order_column =
      filter.order_by !== undefined && list_order_columns.has(filter.order_by)
        ? filter.order_by
        : "created_at";
    const direction = filter.order_direction === "asc" ? "ASC" : "DESC";
    qb.orderBy(`r.${order_column}`, direction);

    qb.skip(filter.skip).take(filter.limit);

    const [rows, total] = await qb.getManyAndCount();
    const data = rows.map((row) => Review.fromPrimitives(row));
    return new PaginatedResult(data, total, filter.page, filter.limit);
  }

  async find_one(id: string): Promise<Review | null> {
    const row = await this.review_repository.findOne({ where: { id } });
    return row ? Review.fromPrimitives(row) : null;
  }
}
