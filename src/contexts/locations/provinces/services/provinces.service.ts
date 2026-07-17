import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { CatalogPaginationFilter } from "@/src/contexts/shared/types/catalog-pagination.filter";
import { PaginatedResult } from "@/src/contexts/shared/types/paginated-result.vo";
import { PaginationHttpDto } from "@/src/contexts/shared/dto/pagination.http-dto";

import { PrimitiveProvince } from "../types/province";
import { ProvinceNotFoundException } from "../exceptions/province-not-found.exception";
import { TypeormProvincesRepository } from "@/src/contexts/locations/provinces/repositories/typeorm.provinces-repository";
import { UpdateProvinceDto } from "../dto/update-province.dto";

const parseProvinceId = (id: string): number => {
  const parsed = Number.parseInt(id, 10);
  if (!Number.isFinite(parsed)) {
    throw new ProvinceNotFoundException(id);
  }
  return parsed;
};

@Injectable()
export class ProvincesService {
  constructor(private readonly provinces_repository: TypeormProvincesRepository) {}

  async update(
    id: string,
    update_province_dto: UpdateProvinceDto,
  ): Promise<{ province: PrimitiveProvince }> {
    const province_id = parseProvinceId(id);
    const existing = await this.provinces_repository.findOne(province_id);
    if (!existing) {
      throw new ProvinceNotFoundException(id);
    }
    const previous = existing.toPrimitives();
    const updated = existing.update({
      name: update_province_dto.name ?? previous.name,
      image_url:
        update_province_dto.image_url !== undefined
          ? update_province_dto.image_url
          : previous.image_url,
    });
    await this.provinces_repository.save(updated);
    return { province: updated.toPrimitives() };
  }

  async findAll(
    query: PaginationHttpDto,
  ): Promise<PaginatedResult<PrimitiveProvince>> {
    const filter = new CatalogPaginationFilter({ ...query });
    const page = await this.provinces_repository.find_all(filter);
    return page.map((province) => province.toPrimitives());
  }

  async findOne(id: string): Promise<{ province: PrimitiveProvince }> {
    const province_id = parseProvinceId(id);
    const province = await this.provinces_repository.findOne(province_id);
    if (!province) {
      throw new ProvinceNotFoundException(id);
    }
    return { province: province.toPrimitives() };
  }
}
