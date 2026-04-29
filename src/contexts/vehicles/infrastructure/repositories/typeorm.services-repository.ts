import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Service } from "../../domain/entities/services";
import { ServicesRepository } from "../../domain/repositories/services.repository";
import { ServiceEntity } from "../persistence/service.entity";
import { ServiceNotFoundException } from "../../domain/exceptions/service-not-found.exception";

export class TypeormServicesRepository extends ServicesRepository {
  constructor(
    @InjectRepository(ServiceEntity)
    private readonly service_repository: Repository<ServiceEntity>,
  ) {
    super();
  }

  async findAll(): Promise<Service[]> {
    const rows = await this.service_repository.find({
      order: { created_at: "asc" },
    });
    return rows.map((row) => Service.fromPrimitives(row));
  }

  async findOne(id: string): Promise<Service | null> {
    const row = await this.service_repository.findOne({ where: { id } });
    if (!row) {
      return null;
    }
    return Service.fromPrimitives(row);
  }

  async save(service: Service): Promise<void> {
    await this.service_repository.save(service.toPrimitives());
  }

  async persist_updated(service: Service): Promise<void> {
    const primitive = service.toPrimitives();
    const row = await this.service_repository.preload({
      id: primitive.id,
      name: primitive.name,
      description: primitive.description,
      slug: primitive.slug,
    });
    if (!row) {
      throw new ServiceNotFoundException(primitive.id);
    }
    await this.service_repository.save(row);
  }

  async remove(id: string): Promise<void> {
    await this.service_repository.delete(id);
  }
}
