import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { CatalogPaginationFilter } from "@/src/contexts/shared/domain/filters/catalog-pagination.filter";
import { PaginatedResult } from "@/src/contexts/shared/domain/value-objects/paginated-result.vo";
import { PaginationHttpDto } from "@/src/contexts/shared/infrastructure/http-dtos/pagination.http-dto";

import { PrimitiveMunicipality } from "../../domain/entities/municipality";
import { MunicipalityNotFoundException } from "../../domain/exceptions/municipality-not-found.exception";
import { MunicipalitiesRepository } from "../../domain/repositories/municipalities.repository";
import { UpdateMunicipalityDto } from "./dto/update-municipality.dto";

const parseMunicipalityId = (id: string): number => {
  const parsed = Number.parseInt(id, 10);
  if (!Number.isFinite(parsed)) {
    throw new MunicipalityNotFoundException(id);
  }
  return parsed;
};

@Injectable()
export class MunicipalitiesUseCase {
  constructor(
    private readonly municipalities_repository: MunicipalitiesRepository,
  ) {}

  async update(
    id: string,
    update_municipality_dto: UpdateMunicipalityDto,
  ): Promise<{ municipality: PrimitiveMunicipality }> {
    const municipality_id = parseMunicipalityId(id);
    const existing =
      await this.municipalities_repository.findOne(municipality_id);
    if (!existing) {
      throw new MunicipalityNotFoundException(id);
    }
    const previous = existing.toPrimitives();
    const updated = existing.update({
      name:
        update_municipality_dto.name !== undefined
          ? update_municipality_dto.name
          : previous.name,
      image_url:
        update_municipality_dto.image_url !== undefined
          ? update_municipality_dto.image_url
          : previous.image_url,
    });
    await this.municipalities_repository.save(updated);
    return { municipality: updated.toPrimitives() };
  }

  async findAll(
    query: PaginationHttpDto,
  ): Promise<PaginatedResult<PrimitiveMunicipality>> {
    const filter = new CatalogPaginationFilter({ ...query });
    const page = await this.municipalities_repository.find_all(filter);
    return page.map((municipality) => municipality.toPrimitives());
  }

  async findOne(id: string): Promise<{ municipality: PrimitiveMunicipality }> {
    const municipality_id = parseMunicipalityId(id);
    const municipality =
      await this.municipalities_repository.findOne(municipality_id);
    if (!municipality) {
      throw new MunicipalityNotFoundException(id);
    }
    return { municipality: municipality.toPrimitives() };
  }
}
