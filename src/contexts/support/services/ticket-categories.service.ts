import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { CatalogPaginationFilter } from "@/src/contexts/shared/types/catalog-pagination.filter";
import { PaginatedResult } from "@/src/contexts/shared/types/paginated-result.vo";
import { PaginationHttpDto } from "@/src/contexts/shared/dto/pagination.http-dto";
import { runPaginatedTypeormFind } from "@/src/contexts/shared/typeorm/run-paginated-typeorm-find";
import { slugify } from "@/src/contexts/shared/slugify-string/slugify";
import { uuidv4 } from "@/src/contexts/shared/uuid-generator/uuid-generator";

import { PrimitiveTicketCategory } from "../types/ticket-category";
import { TicketCategoryNotFoundException } from "../exceptions/ticket-category-not-found.exception";
import { TicketCategoryEntity } from "../entities/ticket-category.entity";

const TICKET_CATEGORY_SORT_KEYS = new Set([
  "id",
  "name",
  "slug",
  "created_at",
  "updated_at",
]);

export interface CreateTicketCategoryInput {
  name: string;
}

export interface UpdateTicketCategoryInput {
  name?: string;
}

@Injectable()
export class TicketCategoriesService {
  constructor(
    @InjectRepository(TicketCategoryEntity)
    private readonly ticket_category_repository: Repository<TicketCategoryEntity>,
  ) {}

  async create(
    input: CreateTicketCategoryInput,
  ): Promise<PrimitiveTicketCategory> {
    const name = input.name.trim();
    const row = this.ticket_category_repository.create({
      id: uuidv4(),
      name,
      slug: slugify(name),
    });
    const saved = await this.ticket_category_repository.save(row);
    return this.toPrimitive(saved);
  }

  async update(
    id: string,
    input: UpdateTicketCategoryInput,
  ): Promise<PrimitiveTicketCategory> {
    const existing = await this.ticket_category_repository.findOne({
      where: { id },
    });
    if (!existing) {
      throw new TicketCategoryNotFoundException(id);
    }

    const next_name =
      input.name === undefined ? existing.name : input.name.trim();
    const next_slug =
      input.name === undefined || input.name === existing.name
        ? existing.slug
        : slugify(next_name);

    const row = await this.ticket_category_repository.preload({
      id,
      name: next_name,
      slug: next_slug,
    });
    if (!row) {
      throw new TicketCategoryNotFoundException(id);
    }

    const saved = await this.ticket_category_repository.save(row);
    return this.toPrimitive(saved);
  }

  async findAll(
    query: PaginationHttpDto,
  ): Promise<PaginatedResult<PrimitiveTicketCategory>> {
    const filter = new CatalogPaginationFilter({ ...query });
    return runPaginatedTypeormFind({
      repository: this.ticket_category_repository,
      filter,
      map_row: (row) => this.toPrimitive(row),
      allowed_sort_keys: TICKET_CATEGORY_SORT_KEYS,
      default_sort_key: "created_at",
    });
  }

  async findOne(id: string): Promise<PrimitiveTicketCategory> {
    const category = await this.findById(id);
    if (!category) {
      throw new TicketCategoryNotFoundException(id);
    }
    return category;
  }

  async findById(id: string): Promise<PrimitiveTicketCategory | null> {
    const row = await this.ticket_category_repository.findOne({ where: { id } });
    if (!row) {
      return null;
    }
    return this.toPrimitive(row);
  }

  async remove(id: string): Promise<void> {
    await this.ticket_category_repository.delete(id);
  }

  private toPrimitive(row: TicketCategoryEntity): PrimitiveTicketCategory {
    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }
}
