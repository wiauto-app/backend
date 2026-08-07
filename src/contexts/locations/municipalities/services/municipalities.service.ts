import { NotFoundException } from "@nestjs/common";

import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { CatalogPaginationFilter } from "@/src/contexts/shared/types/catalog-pagination.filter";
import { PaginatedResult } from "@/src/contexts/shared/types/paginated-result.vo";
import { TypeormProvincesRepository } from "@/src/contexts/locations/provinces/repositories/typeorm.provinces-repository";

import { PrimitiveMunicipality } from "../types/municipality";
import { MunicipalityNotFoundException } from "../exceptions/municipality-not-found.exception";
import { TypeormMunicipalitiesRepository } from "@/src/contexts/locations/municipalities/repositories/typeorm.municipalities-repository";
import { UpdateMunicipalityDto } from "../dto/update-municipality.dto";
import { FindAllMunicipalitiesHttpDto } from "../api/v1/municipalities-v1/dto/find-all-municipalities.http-dto";

const parseMunicipalityId = (id: string): number => {
  const parsed = Number.parseInt(id, 10);
  if (!Number.isFinite(parsed)) {
    throw new MunicipalityNotFoundException(id);
  }
  return parsed;
};

@Injectable()
export class MunicipalitiesService {
  constructor(
    private readonly municipalities_repository: TypeormMunicipalitiesRepository,
    private readonly provinces_repository: TypeormProvincesRepository,
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
    query: FindAllMunicipalitiesHttpDto,
  ): Promise<PaginatedResult<PrimitiveMunicipality>> {
    const filter = new CatalogPaginationFilter({ ...query });
    const provinceSlug = query.province_slug?.trim();
    let ineCodePrefix: string | undefined;

    if (provinceSlug) {
      const province = await this.provinces_repository.findBySlug(provinceSlug);
      if (!province) {
        throw new NotFoundException(
          `Provincia con slug ${provinceSlug} no encontrada`,
        );
      }
      ineCodePrefix = province.toPrimitives().cod_prov;
    }

    const page = await this.municipalities_repository.find_all(filter, {
      ineCodePrefix,
    });
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
