import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Traction } from "../../domain/entities/traction";
import { TractionsRepository } from "../../domain/repositories/tractions.repository";
import { TractionEntity } from "../persistence/traction.entity";
import { TractionNotFoundException } from "../../domain/exceptions/traction-not-found.exception";

export class TypeormTractionRepository extends TractionsRepository {
  constructor(
    @InjectRepository(TractionEntity)
    private readonly traction_repository: Repository<TractionEntity>,
  ) {
    super();
  }

  async findAll(): Promise<Traction[]> {
    const rows = await this.traction_repository.find({
      order: { created_at: "asc" },
    });
    return rows.map((row) => Traction.fromPrimitives(row));
  }

  async findOne(id: string): Promise<Traction | null> {
    const row = await this.traction_repository.findOne({ where: { id } });
    if (!row) {
      return null;
    }
    return Traction.fromPrimitives(row);
  }

  async save(traction: Traction): Promise<void> {
    await this.traction_repository.save(traction.toPrimitives());
  }

  async persist_updated(traction: Traction): Promise<void> {
    const primitive = traction.toPrimitives();
    const row = await this.traction_repository.preload({
      id: primitive.id,
      name: primitive.name,
      slug: primitive.slug,
    });
    if (!row) {
      throw new TractionNotFoundException(primitive.id);
    }
    await this.traction_repository.save(row);
  }

  async remove(id: string): Promise<void> {
    await this.traction_repository.delete(id);
  }
}
