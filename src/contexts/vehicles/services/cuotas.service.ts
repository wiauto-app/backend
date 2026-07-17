import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { CatalogPaginationFilter } from "@/src/contexts/shared/types/catalog-pagination.filter";
import { PaginatedResult } from "@/src/contexts/shared/types/paginated-result.vo";
import { PaginationHttpDto } from "@/src/contexts/shared/dto/pagination.http-dto";
import { runPaginatedTypeormFind } from "@/src/contexts/shared/typeorm/run-paginated-typeorm-find";
import { slugify } from "@/src/contexts/shared/slugify-string/slugify";
import { uuidv4 } from "@/src/contexts/shared/uuid-generator/uuid-generator";
import { PrimitiveCuota } from "@/src/contexts/vehicles/types/cuota";
import { CuotaNotFoundException } from "@/src/contexts/vehicles/exceptions/cuota-not-found.exception";
import { CuotaEntity } from "@/src/contexts/vehicles/entities/cuota.entity";

const CUOTA_SORT_KEYS = new Set([
  "id",
  "name",
  "slug",
  "value",
  "created_at",
  "updated_at",
]);

export interface CreateCuotaInput {
  name: string;
  value: number;
}

export interface UpdateCuotaInput {
  name?: string;
  value?: number;
}

@Injectable()
export class CuotasService {
  constructor(
    @InjectRepository(CuotaEntity)
    private readonly cuota_repository: Repository<CuotaEntity>,
  ) {}

  async create(input: CreateCuotaInput): Promise<{ cuota: PrimitiveCuota }> {
    const name = input.name.trim();
    const row = this.cuota_repository.create({
      id: uuidv4(),
      name,
      slug: slugify(name),
      value: input.value,
    });
    const saved = await this.cuota_repository.save(row);
    return { cuota: this.toPrimitive(saved) };
  }

  async update(
    id: string,
    input: UpdateCuotaInput,
  ): Promise<{ cuota: PrimitiveCuota }> {
    const existing = await this.cuota_repository.findOne({ where: { id } });
    if (!existing) {
      throw new CuotaNotFoundException(id);
    }

    const next_name =
      input.name === undefined ? existing.name : input.name.trim();
    const next_value = input.value === undefined ? existing.value : input.value;
    const next_slug =
      input.name === undefined ? existing.slug : slugify(next_name);

    const row = await this.cuota_repository.preload({
      id,
      name: next_name,
      slug: next_slug,
      value: next_value,
    });
    if (!row) {
      throw new CuotaNotFoundException(id);
    }

    const saved = await this.cuota_repository.save(row);
    return { cuota: this.toPrimitive(saved) };
  }

  async findAll(
    query: PaginationHttpDto,
  ): Promise<PaginatedResult<PrimitiveCuota>> {
    const filter = new CatalogPaginationFilter({ ...query });
    return runPaginatedTypeormFind({
      repository: this.cuota_repository,
      filter,
      map_row: (row) => this.toPrimitive(row),
      allowed_sort_keys: CUOTA_SORT_KEYS,
      default_sort_key: "value",
    });
  }

  async findOne(id: string): Promise<{ cuota: PrimitiveCuota }> {
    const cuota = await this.findById(id);
    if (!cuota) {
      throw new CuotaNotFoundException(id);
    }
    return { cuota };
  }

  async findById(id: string): Promise<PrimitiveCuota | null> {
    const row = await this.cuota_repository.findOne({ where: { id } });
    if (!row) {
      return null;
    }
    return this.toPrimitive(row);
  }

  async remove(id: string): Promise<void> {
    await this.cuota_repository.delete(id);
  }

  private toPrimitive(row: CuotaEntity): PrimitiveCuota {
    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      value: row.value,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }
}
