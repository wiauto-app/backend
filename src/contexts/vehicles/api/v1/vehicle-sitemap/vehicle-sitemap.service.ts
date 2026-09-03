import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { TypeOrmVehicleRepository } from "@/src/contexts/vehicles/repositories/typeorm.vehicle-repository";

import {
  VEHICLE_SITEMAP_PAGE_SIZE,
  VehicleSitemapHttpDto,
} from "./vehicle-sitemap.http-dto";

export { VEHICLE_SITEMAP_PAGE_SIZE };

export interface VehicleSitemapEntry {
  id: string;
  updatedAt: string;
  isFeatured: boolean;
}

export interface VehicleSitemapMeta {
  total: number;
  limit: number;
  totalPages: number;
}

export interface VehicleSitemapPage {
  data: VehicleSitemapEntry[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class VehicleSitemapService {
  constructor(
    private readonly vehicle_repository: TypeOrmVehicleRepository,
  ) {}

  async getMeta(limit = VEHICLE_SITEMAP_PAGE_SIZE): Promise<VehicleSitemapMeta> {
    const total = await this.vehicle_repository.countSitemapVehicles();

    return {
      total,
      limit,
      totalPages: total === 0 ? 0 : Math.ceil(total / limit),
    };
  }

  async getPage(dto: VehicleSitemapHttpDto): Promise<VehicleSitemapPage> {
    const { page, limit } = dto;
    const { data, total } =
      await this.vehicle_repository.findSitemapVehicles({ page, limit });

    return {
      data,
      total,
      page,
      limit,
      totalPages: total === 0 ? 0 : Math.ceil(total / limit),
    };
  }
}
