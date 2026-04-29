import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
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

  async findAll(): Promise<{ services: PrimitiveService[] }> {
    const services = await this.services_repository.findAll();
    return { services: services.map((s) => s.toPrimitives()) };
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
