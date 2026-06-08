import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { PaginatedResult } from "@/src/contexts/shared/domain/value-objects/paginated-result.vo";
import { InjectRepository } from "@nestjs/typeorm";
import { NotFoundException } from "@nestjs/common";
import { Repository } from "typeorm";

import { Review } from "../../domain/entities/reviews";
import { ReviewFilter } from "../../domain/filters/review.filter";
import { ReviewsRepository } from "../../domain/repositories/reviews.repository";
import { ReviewListItem } from "../../domain/read-models/review-list-item";
import { ReviewEntity } from "../persistence/review.entity";
import { ProfileEntity } from "@/src/contexts/profiles/infrastructure/persistence/profile.entity";

const list_order_columns = new Set(["id", "rating", "created_at", "updated_at"]);

const format_review_author = (profile: ProfileEntity | null | undefined): string => {
  if (!profile?.name) {
    return "Usuario";
  }
  const author = `${profile.name} ${profile.last_name ?? ""}`.trim();
  return author || "Usuario";
};

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

  async find_all(filter: ReviewFilter): Promise<PaginatedResult<ReviewListItem>> {
    const qb = this.review_repository
      .createQueryBuilder("r")
      .leftJoinAndSelect("r.profile", "profile")
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
    const direction = filter.order_direction;
    qb.orderBy(`r.${order_column}`, direction);

    qb.skip((filter.page - 1) * filter.limit).take(filter.limit);

    const [rows, total] = await qb.getManyAndCount();
    const data: ReviewListItem[] = rows.map((row) => ({
      id: row.id,
      rating: row.rating,
      comment: row.comment,
      created_at: row.created_at,
      author: format_review_author(row.profile),
    }));
    return new PaginatedResult(data, total, filter.page, filter.limit);
  }

  async find_one(id: string): Promise<Review | null> {
    const row = await this.review_repository.findOne({ where: { id } });
    return row ? Review.fromPrimitives(row) : null;
  }
}
