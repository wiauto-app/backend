import { CatalogPaginationFilter } from "@/src/contexts/shared/domain/filters/catalog-pagination.filter";
import { PaginatedResult } from "@/src/contexts/shared/domain/value-objects/paginated-result.vo";
import { runPaginatedTypeormFind } from "@/src/contexts/shared/infrastructure/typeorm/run-paginated-typeorm-find";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { TicketCategory } from "../../domain/entities/ticket-category";
import { TicketCategoryNotFoundException } from "../../domain/exceptions/ticket-category-not-found.exception";
import { TicketCategoryRepository } from "../../domain/repositories/ticket-category.repository";
import { TicketCategoryEntity } from "../persistence/ticket-category.entity";

const TICKET_CATEGORY_SORT_KEYS = new Set([
  "id",
  "name",
  "slug",
  "created_at",
  "updated_at",
]);

export class TypeOrmTicketCategoryRepository extends TicketCategoryRepository {
  constructor(
    @InjectRepository(TicketCategoryEntity)
    private readonly ticket_category_repository: Repository<TicketCategoryEntity>,
  ) {
    super();
  }

  async findOne(id: string): Promise<TicketCategory | null> {
    const row = await this.ticket_category_repository.findOne({ where: { id } });
    if (!row) {
      return null;
    }
    return TicketCategory.fromPrimitives(row);
  }

  async find_all(
    filter: CatalogPaginationFilter,
  ): Promise<PaginatedResult<TicketCategory>> {
    return runPaginatedTypeormFind({
      repository: this.ticket_category_repository,
      filter,
      map_row: (row) => TicketCategory.fromPrimitives(row),
      allowed_sort_keys: TICKET_CATEGORY_SORT_KEYS,
      default_sort_key: "created_at",
    });
  }

  async save(ticket_category: TicketCategory): Promise<TicketCategory> {
    const saved = await this.ticket_category_repository.save(
      ticket_category.toPrimitives(),
    );
    return TicketCategory.fromPrimitives(saved);
  }

  async update(ticket_category: TicketCategory): Promise<void> {
    const primitive = ticket_category.toPrimitives();
    const row = await this.ticket_category_repository.preload({
      id: primitive.id,
      name: primitive.name,
      slug: primitive.slug,
    });
    if (!row) {
      throw new TicketCategoryNotFoundException(primitive.id);
    }
    await this.ticket_category_repository.save(row);
  }

  async delete(id: string): Promise<void> {
    await this.ticket_category_repository.delete(id);
  }
}
