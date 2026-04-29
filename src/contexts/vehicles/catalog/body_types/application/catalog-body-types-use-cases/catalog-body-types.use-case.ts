import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import {
  CatalogBodyType,
  PrimitiveCatalogBodyType,
} from "../../domain/entities/catalog-body-type";
import { CatalogBodyTypesRepository } from "../../domain/repositories/catalog-body-types.repository";
import { CatalogBodyTypeNotFoundException } from "../../domain/exceptions/catalog-body-type-not-found.exception";
import { CreateCatalogBodyTypeDto } from "./dto/create-catalog-body-type.dto";
import { UpdateCatalogBodyTypeDto } from "./dto/update-catalog-body-type.dto";

@Injectable()
export class CatalogBodyTypesUseCase {
  constructor(private readonly repository: CatalogBodyTypesRepository) {}

  async create(
    dto: CreateCatalogBodyTypeDto,
  ): Promise<{ body_type: PrimitiveCatalogBodyType }> {
    const saved = await this.repository.save(CatalogBodyType.create(dto));
    return { body_type: saved.toPrimitives() };
  }

  async update(
    id: number,
    dto: UpdateCatalogBodyTypeDto,
  ): Promise<{ body_type: PrimitiveCatalogBodyType }> {
    const existing = await this.repository.findOne(id);
    if (!existing) {
      throw new CatalogBodyTypeNotFoundException(id);
    }
    const prev = existing.toPrimitives();
    const saved = await this.repository.save(
      existing.update({
        body_type_id: dto.body_type_id ?? prev.body_type_id,
        doors: dto.doors ?? prev.doors,
        name: dto.name ?? prev.name,
      }),
    );
    return { body_type: saved.toPrimitives() };
  }

  async findAll(): Promise<{ body_types: PrimitiveCatalogBodyType[] }> {
    const items = await this.repository.findAll();
    return { body_types: items.map((x) => x.toPrimitives()) };
  }

  async findOne(id: number): Promise<{ body_type: PrimitiveCatalogBodyType }> {
    const row = await this.repository.findOne(id);
    if (!row) {
      throw new CatalogBodyTypeNotFoundException(id);
    }
    return { body_type: row.toPrimitives() };
  }

  async remove(id: number): Promise<void> {
    await this.repository.remove(id);
  }
}
