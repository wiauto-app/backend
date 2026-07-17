import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { CatalogPaginationFilter } from "@/src/contexts/shared/types/catalog-pagination.filter";
import { PaginatedResult } from "@/src/contexts/shared/types/paginated-result.vo";
import { PaginationHttpDto } from "@/src/contexts/shared/dto/pagination.http-dto";
import { runPaginatedTypeormFind } from "@/src/contexts/shared/typeorm/run-paginated-typeorm-find";
import { slugify } from "@/src/contexts/shared/slugify-string/slugify";
import { uuidv4 } from "@/src/contexts/shared/uuid-generator/uuid-generator";
import { PrimitiveColor } from "@/src/contexts/vehicles/types/color";
import { ColorNotFoundException } from "@/src/contexts/vehicles/exceptions/color-not-found.exception";
import { ColorEntity } from "@/src/contexts/vehicles/entities/color.entity";

const COLOR_SORT_KEYS = new Set([
  "id",
  "name",
  "hex_code",
  "slug",
  "created_at",
  "updated_at",
]);

export interface CreateColorInput {
  name: string;
  hex_code: string;
}

export interface UpdateColorInput {
  name?: string;
  hex_code?: string;
}

@Injectable()
export class ColorsService {
  constructor(
    @InjectRepository(ColorEntity)
    private readonly color_repository: Repository<ColorEntity>,
  ) {}

  async create(input: CreateColorInput): Promise<{ color: PrimitiveColor }> {
    const name = input.name.trim();
    const row = this.color_repository.create({
      id: uuidv4(),
      name,
      hex_code: input.hex_code,
      slug: slugify(name),
    });
    const saved = await this.color_repository.save(row);
    return { color: this.toPrimitive(saved) };
  }

  async update(
    id: string,
    input: UpdateColorInput,
  ): Promise<{ color: PrimitiveColor }> {
    const existing = await this.color_repository.findOne({ where: { id } });
    if (!existing) {
      throw new ColorNotFoundException(id);
    }

    const next_name =
      input.name === undefined ? existing.name : input.name.trim();
    const next_hex_code =
      input.hex_code === undefined ? existing.hex_code : input.hex_code;
    const next_slug =
      input.name === undefined ? existing.slug : slugify(next_name);

    const row = await this.color_repository.preload({
      id,
      name: next_name,
      hex_code: next_hex_code,
      slug: next_slug,
    });
    if (!row) {
      throw new ColorNotFoundException(id);
    }

    const saved = await this.color_repository.save(row);
    return { color: this.toPrimitive(saved) };
  }

  async findAll(
    query: PaginationHttpDto,
  ): Promise<PaginatedResult<PrimitiveColor>> {
    const filter = new CatalogPaginationFilter({ ...query });
    return runPaginatedTypeormFind({
      repository: this.color_repository,
      filter,
      map_row: (row) => this.toPrimitive(row),
      allowed_sort_keys: COLOR_SORT_KEYS,
      default_sort_key: "created_at",
    });
  }

  async findOne(id: string): Promise<{ color: PrimitiveColor }> {
    const color = await this.findById(id);
    if (!color) {
      throw new ColorNotFoundException(id);
    }
    return { color };
  }

  async findById(id: string): Promise<PrimitiveColor | null> {
    const row = await this.color_repository.findOne({ where: { id } });
    if (!row) {
      return null;
    }
    return this.toPrimitive(row);
  }

  async remove(id: string): Promise<void> {
    await this.color_repository.delete(id);
  }

  private toPrimitive(row: ColorEntity): PrimitiveColor {
    return {
      id: row.id,
      name: row.name,
      hex_code: row.hex_code,
      slug: row.slug,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }
}
