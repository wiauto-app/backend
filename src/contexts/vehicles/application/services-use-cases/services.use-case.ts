import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { CatalogPaginationFilter } from "@/src/contexts/shared/domain/filters/catalog-pagination.filter";
import { PaginatedResult } from "@/src/contexts/shared/domain/value-objects/paginated-result.vo";
import { PaginationHttpDto } from "@/src/contexts/shared/infrastructure/http-dtos/pagination.http-dto";
import { ServicesRepository } from "../../domain/repositories/services.repository";
import { CreateServiceDto } from "./dto/create-service.dto";
import { UpdateServiceDto } from "./dto/update-service.dto";
import { PrimitiveService, Service } from "../../domain/entities/services";
import { ServiceNotFoundException } from "../../domain/exceptions/service-not-found.exception";

@Injectable()
export class ServicesUseCase {
  constructor(private readonly services_repository: ServicesRepository) {}

  async create(
    create_service_dto: CreateServiceDto,
  ): Promise<{ service: PrimitiveService }> {
    const service = Service.create({
      name: create_service_dto.name,
      description: create_service_dto.description,
    });
    await this.services_repository.save(service);
    return { service: service.toPrimitives() };
  }

  async update(
    id: string,
    update_service_dto: UpdateServiceDto,
  ): Promise<{ service: PrimitiveService }> {
    const existing = await this.services_repository.findOne(id);
    if (!existing) {
      throw new ServiceNotFoundException(id);
    }
    const updated = existing.update({
      name: update_service_dto.name,
      description: update_service_dto.description,
    });
    await this.services_repository.persist_updated(updated);
    return { service: updated.toPrimitives() };
  }

  async findAll(
    query: PaginationHttpDto,
  ): Promise<PaginatedResult<PrimitiveService>> {
    const filter = new CatalogPaginationFilter({ ...query });
    const page = await this.services_repository.find_all(filter);
    return page.map((s) => s.toPrimitives());
  }

  async findOne(id: string): Promise<{ service: PrimitiveService }> {
    const service = await this.services_repository.findOne(id);
    if (!service) {
      throw new ServiceNotFoundException(id);
    }
    return { service: service.toPrimitives() };
  }

  async remove(id: string): Promise<void> {
    await this.services_repository.remove(id);
  }
}
