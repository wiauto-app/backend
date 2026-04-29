import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { WarrantyType } from "../../domain/entities/warranty-type";
import { WarrantyTypesRepository } from "../../domain/repositories/warranty-types.repository";
import { WarrantyTypeEntity } from "../persistence/warranty-type.entity";
import { WarrantyTypeNotFoundException } from "../../domain/exceptions/warranty-type-not-found.exception";

export class TypeormWarrantyTypesRepository extends WarrantyTypesRepository {
  constructor(
    @InjectRepository(WarrantyTypeEntity)
    private readonly warranty_type_repository: Repository<WarrantyTypeEntity>,
  ) {
    super();
  }

  async findAll(): Promise<WarrantyType[]> {
    const rows = await this.warranty_type_repository.find({
      order: { created_at: "asc" },
    });
    return rows.map((row) => WarrantyType.fromPrimitives(row));
  }

  async findOne(id: string): Promise<WarrantyType | null> {
    const row = await this.warranty_type_repository.findOne({ where: { id } });
    if (!row) {
      return null;
    }
    return WarrantyType.fromPrimitives(row);
  }

  async save(warranty_type: WarrantyType): Promise<void> {
    await this.warranty_type_repository.save(warranty_type.toPrimitives());
  }

  async persist_updated(warranty_type: WarrantyType): Promise<void> {
    const primitive = warranty_type.toPrimitives();
    const row = await this.warranty_type_repository.preload({
      id: primitive.id,
      name: primitive.name,
      description: primitive.description,
      slug: primitive.slug,
    });
    if (!row) {
      throw new WarrantyTypeNotFoundException(primitive.id);
    }
    await this.warranty_type_repository.save(row);
  }

  async remove(id: string): Promise<void> {
    await this.warranty_type_repository.delete(id);
  }
}
