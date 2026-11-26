import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { slugify } from "@/src/contexts/shared/slugify-string/slugify";
import { CatalogPaginationFilter } from "@/src/contexts/shared/types/catalog-pagination.filter";
import { PaginatedResult } from "@/src/contexts/shared/types/paginated-result.vo";
import { CreateCatalogVersionHttpDto } from "../api/catalog-versions-v1/dto/create-catalog-version.http-dto";
import { FindAllVersionsHttpDto } from "../api/catalog-versions-v1/dto/find-all-versions.http-dto";
import { UpdateCatalogVersionHttpDto } from "../api/catalog-versions-v1/update-catalog-version.http-dto";
import { VersionEntity } from "../entities/version.entity";
import { CatalogVersionNotFoundException } from "../exceptions/catalog-version-not-found.exception";
import { TypeormCatalogVersionRepository } from "../repositories/typeorm.catalog-version-repository";
import {
  resolveVehicleYearId,
  ResolveVehicleYearIdInput,
} from "../helpers/resolve-vehicle-year-id";

@Injectable()
export class CatalogVersionsService {
  constructor(private readonly repository: TypeormCatalogVersionRepository) {}

  async create(
    dto: CreateCatalogVersionHttpDto,
  ): Promise<{ version: VersionEntity }> {
    const version = new VersionEntity();
    version.make_id = dto.make_id;
    version.model_id = dto.model_id;
    version.body_type_id = dto.body_type_id;
    version.fuel_type_id = dto.fuel_type_id;
    version.year_id = dto.year_id;
    version.name = dto.name;
    version.slug = slugify(dto.name);
    const saved = await this.repository.save(version);
    await this.repository.addYears(saved.id, [
      saved.year_id,
      ...(dto.year_ids ?? []),
    ] as number[]);
    return { version: saved };
  }

  async update(
    id: number,
    dto: UpdateCatalogVersionHttpDto,
  ): Promise<{ version: VersionEntity }> {
    const existing = await this.repository.findOne(id);
    if (!existing) {
      throw new CatalogVersionNotFoundException(id);
    }

    if (dto.make_id !== undefined) {
      existing.make_id = dto.make_id;
    }
    if (dto.model_id !== undefined) {
      existing.model_id = dto.model_id;
    }
    if (dto.body_type_id !== undefined) {
      existing.body_type_id = dto.body_type_id;
    }
    if (dto.fuel_type_id !== undefined) {
      existing.fuel_type_id = dto.fuel_type_id;
    }
    if (dto.year_id !== undefined) {
      existing.year_id = dto.year_id;
    }
    if (dto.name !== undefined) {
      existing.name = dto.name;
      existing.slug = slugify(dto.name);
    }

    const saved = await this.repository.save(existing);
    const added_year_ids = [
      ...(dto.year_id !== undefined ? [dto.year_id] : []),
      ...(dto.year_ids ?? []),
    ];
    await this.repository.addYears(saved.id, added_year_ids as number[]);
    return { version: saved };
  }

  async findAll(
    dto: FindAllVersionsHttpDto,
  ): Promise<PaginatedResult<VersionEntity>> {
    const filter = new CatalogPaginationFilter({ ...dto });
    return this.repository.findAll(filter);
  }

  async findOne(id: number): Promise<{ version: VersionEntity }> {
    const version = await this.findById(id);
    if (!version) {
      throw new CatalogVersionNotFoundException(id);
    }
    return { version };
  }

  async findById(id: number): Promise<VersionEntity | null> {
    return this.repository.findOne(id);
  }

  /** Indica si la versión existe en ese año (`version_year`). */
  async hasYear(version_id: number, year_id: number): Promise<boolean> {
    return this.repository.hasYear(version_id, year_id);
  }

  /** Resuelve y valida el año de un vehículo; ver `resolveVehicleYearId`. */
  async resolveVehicleYearId(input: ResolveVehicleYearIdInput): Promise<number> {
    return resolveVehicleYearId(input, (version_id, year_id) =>
      this.hasYear(version_id, year_id),
    );
  }

  async remove(id: number): Promise<void> {
    await this.repository.remove(id);
  }
}
