import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { CatalogPaginationFilter } from "@/src/contexts/shared/domain/filters/catalog-pagination.filter";
import { PaginatedResult } from "@/src/contexts/shared/domain/value-objects/paginated-result.vo";
import { PaginationHttpDto } from "@/src/contexts/shared/infrastructure/http-dtos/pagination.http-dto";
import { WarrantyTypesRepository } from "../../domain/repositories/warranty-types.repository";
import { CreateWarrantyTypeDto } from "./dto/create-warranty-type.dto";
import { UpdateWarrantyTypeDto } from "./dto/update-warranty-type.dto";
import {
  PrimitiveWarrantyType,
  WarrantyType,
} from "../../domain/entities/warranty-type";
import { WarrantyTypeNotFoundException } from "../../domain/exceptions/warranty-type-not-found.exception";

@Injectable()
export class WarrantyTypesUseCase {
  constructor(
    private readonly warranty_types_repository: WarrantyTypesRepository,
  ) {}

  async create(
    create_warranty_type_dto: CreateWarrantyTypeDto,
  ): Promise<{ warranty_type: PrimitiveWarrantyType }> {
    const warranty_type = WarrantyType.create({
      name: create_warranty_type_dto.name,
      description: create_warranty_type_dto.description,
    });
    await this.warranty_types_repository.save(warranty_type);
    return { warranty_type: warranty_type.toPrimitives() };
  }

  async update(
    id: string,
    update_warranty_type_dto: UpdateWarrantyTypeDto,
  ): Promise<{ warranty_type: PrimitiveWarrantyType }> {
    const existing = await this.warranty_types_repository.findOne(id);
    if (!existing) {
      throw new WarrantyTypeNotFoundException(id);
    }
    const updated = existing.update({
      name: update_warranty_type_dto.name,
      description: update_warranty_type_dto.description,
    });
    await this.warranty_types_repository.persist_updated(updated);
    return { warranty_type: updated.toPrimitives() };
  }

  async findAll(
    query: PaginationHttpDto,
  ): Promise<PaginatedResult<PrimitiveWarrantyType>> {
    const filter = new CatalogPaginationFilter({ ...query });
    const page = await this.warranty_types_repository.find_all(filter);
    return page.map((w) => w.toPrimitives());
  }

  async findOne(id: string): Promise<{ warranty_type: PrimitiveWarrantyType }> {
    const warranty_type = await this.warranty_types_repository.findOne(id);
    if (!warranty_type) {
      throw new WarrantyTypeNotFoundException(id);
    }
    return { warranty_type: warranty_type.toPrimitives() };
  }

  async remove(id: string): Promise<void> {
    await this.warranty_types_repository.remove(id);
  }
}
