import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { CatalogPaginationFilter } from "@/src/contexts/shared/types/catalog-pagination.filter";
import { PaginatedResult } from "@/src/contexts/shared/types/paginated-result.vo";
import { PaginationHttpDto } from "@/src/contexts/shared/dto/pagination.http-dto";
import { runPaginatedTypeormFind } from "@/src/contexts/shared/typeorm/run-paginated-typeorm-find";
import { slugify } from "@/src/contexts/shared/slugify-string/slugify";
import { uuidv4 } from "@/src/contexts/shared/uuid-generator/uuid-generator";
import { PrimitiveDgtLabel } from "@/src/contexts/vehicles/types/dgt-label";
import { DgtLabelNotFoundException } from "@/src/contexts/vehicles/exceptions/dgt-label-not-found.exception";
import { DgtLabelEntity } from "@/src/contexts/vehicles/entities/dgt-label.entity";

const DGT_LABEL_SORT_KEYS = new Set([
  "id",
  "name",
  "code",
  "description",
  "slug",
  "created_at",
  "updated_at",
]);

const normalizeDgtCode = (code: string): string => code.trim().toUpperCase();

export interface CreateDgtLabelInput {
  name: string;
  code: string;
  description: string;
}

export interface UpdateDgtLabelInput {
  name?: string;
  code?: string;
  description?: string;
}

@Injectable()
export class DgtLabelsService {
  constructor(
    @InjectRepository(DgtLabelEntity)
    private readonly dgt_label_repository: Repository<DgtLabelEntity>,
  ) {}

  async create(
    input: CreateDgtLabelInput,
  ): Promise<{ dgt_label: PrimitiveDgtLabel }> {
    const name = input.name.trim();
    const row = this.dgt_label_repository.create({
      id: uuidv4(),
      name,
      code: normalizeDgtCode(input.code),
      description: input.description,
      slug: slugify(name),
    });
    const saved = await this.dgt_label_repository.save(row);
    return { dgt_label: this.toPrimitive(saved) };
  }

  async update(
    id: string,
    input: UpdateDgtLabelInput,
  ): Promise<{ dgt_label: PrimitiveDgtLabel }> {
    const existing = await this.dgt_label_repository.findOne({ where: { id } });
    if (!existing) {
      throw new DgtLabelNotFoundException(id);
    }

    const next_name =
      input.name === undefined ? existing.name : input.name.trim();
    const next_code =
      input.code === undefined ? existing.code : normalizeDgtCode(input.code);
    const next_description =
      input.description === undefined ? existing.description : input.description;
    const next_slug =
      input.name === undefined ? existing.slug : slugify(next_name);

    const row = await this.dgt_label_repository.preload({
      id,
      name: next_name,
      code: next_code,
      description: next_description,
      slug: next_slug,
    });
    if (!row) {
      throw new DgtLabelNotFoundException(id);
    }

    const saved = await this.dgt_label_repository.save(row);
    return { dgt_label: this.toPrimitive(saved) };
  }

  async findAll(
    query: PaginationHttpDto,
  ): Promise<PaginatedResult<PrimitiveDgtLabel>> {
    const filter = new CatalogPaginationFilter({ ...query });
    return runPaginatedTypeormFind({
      repository: this.dgt_label_repository,
      filter,
      map_row: (row) => this.toPrimitive(row),
      allowed_sort_keys: DGT_LABEL_SORT_KEYS,
      default_sort_key: "code",
    });
  }

  async findOne(id: string): Promise<{ dgt_label: PrimitiveDgtLabel }> {
    const dgt_label = await this.findById(id);
    if (!dgt_label) {
      throw new DgtLabelNotFoundException(id);
    }
    return { dgt_label };
  }

  async findById(id: string): Promise<PrimitiveDgtLabel | null> {
    const row = await this.dgt_label_repository.findOne({ where: { id } });
    if (!row) {
      return null;
    }
    return this.toPrimitive(row);
  }

  async remove(id: string): Promise<void> {
    await this.dgt_label_repository.delete(id);
  }

  private toPrimitive(row: DgtLabelEntity): PrimitiveDgtLabel {
    return {
      id: row.id,
      name: row.name,
      code: row.code,
      description: row.description,
      slug: row.slug,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }
}
