import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { CatalogPaginationFilter } from "@/src/contexts/shared/types/catalog-pagination.filter";
import { PaginatedResult } from "@/src/contexts/shared/types/paginated-result.vo";
import { PaginationHttpDto } from "@/src/contexts/shared/dto/pagination.http-dto";
import { runPaginatedTypeormFind } from "@/src/contexts/shared/typeorm/run-paginated-typeorm-find";
import { slugify } from "@/src/contexts/shared/slugify-string/slugify";
import { uuidv4 } from "@/src/contexts/shared/uuid-generator/uuid-generator";
import { PrimitiveTraction } from "@/src/contexts/vehicles/types/traction";
import { TractionNotFoundException } from "@/src/contexts/vehicles/exceptions/traction-not-found.exception";
import { TractionEntity } from "@/src/contexts/vehicles/entities/traction.entity";

const TRACTION_SORT_KEYS = new Set([
  "id",
  "name",
  "slug",
  "created_at",
  "updated_at",
]);

export interface CreateTractionInput {
  name: string;
}

export interface UpdateTractionInput {
  name?: string;
}

@Injectable()
export class TractionsService {
  constructor(
    @InjectRepository(TractionEntity)
    private readonly traction_repository: Repository<TractionEntity>,
  ) {}

  async create(
    input: CreateTractionInput,
  ): Promise<{ traction: PrimitiveTraction }> {
    const name = input.name.trim();
    const row = this.traction_repository.create({
      id: uuidv4(),
      name,
      slug: slugify(name),
    });
    const saved = await this.traction_repository.save(row);
    return { traction: this.toPrimitive(saved) };
  }

  async update(
    id: string,
    input: UpdateTractionInput,
  ): Promise<{ traction: PrimitiveTraction }> {
    const existing = await this.traction_repository.findOne({ where: { id } });
    if (!existing) {
      throw new TractionNotFoundException(id);
    }

    const next_name =
      input.name === undefined ? existing.name : input.name.trim();
    const next_slug =
      input.name === undefined ? existing.slug : slugify(next_name);

    const row = await this.traction_repository.preload({
      id,
      name: next_name,
      slug: next_slug,
    });
    if (!row) {
      throw new TractionNotFoundException(id);
    }

    const saved = await this.traction_repository.save(row);
    return { traction: this.toPrimitive(saved) };
  }

  async findAll(
    query: PaginationHttpDto,
  ): Promise<PaginatedResult<PrimitiveTraction>> {
    const filter = new CatalogPaginationFilter({ ...query });
    return runPaginatedTypeormFind({
      repository: this.traction_repository,
      filter,
      map_row: (row) => this.toPrimitive(row),
      allowed_sort_keys: TRACTION_SORT_KEYS,
      default_sort_key: "created_at",
    });
  }

  async findOne(id: string): Promise<{ traction: PrimitiveTraction }> {
    const traction = await this.findById(id);
    if (!traction) {
      throw new TractionNotFoundException(id);
    }
    return { traction };
  }

  async findById(id: string): Promise<PrimitiveTraction | null> {
    const row = await this.traction_repository.findOne({ where: { id } });
    if (!row) {
      return null;
    }
    return this.toPrimitive(row);
  }

  async remove(id: string): Promise<void> {
    await this.traction_repository.delete(id);
  }

  private toPrimitive(row: TractionEntity): PrimitiveTraction {
    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }
}
