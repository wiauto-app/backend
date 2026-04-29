import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { TractionsRepository } from "../../domain/repositories/tractions.repository";
import { CreateTractionDto } from "./dto/create-traction.dto";
import {
  PrimitiveTraction,
  Traction,
} from "../../domain/entities/traction";
import { TractionNotFoundException } from "../../domain/exceptions/traction-not-found.exception";
import { UpdateTractionDto } from "./dto/update-traction.dto";

@Injectable()
export class TractionsUseCase {
  constructor(
    private readonly tractions_repository: TractionsRepository,
  ) {}

  async create(
    create_traction_dto: CreateTractionDto,
  ): Promise<{ traction: PrimitiveTraction }> {
    const traction = Traction.create({ name: create_traction_dto.name });
    await this.tractions_repository.save(traction);
    return { traction: traction.toPrimitives() };
  }

  async update(
    id: string,
    update_traction_dto: UpdateTractionDto,
  ): Promise<{ traction: PrimitiveTraction }> {
    const existing = await this.tractions_repository.findOne(id);
    if (!existing) {
      throw new TractionNotFoundException(id);
    }
    const updated = existing.update({
      name: update_traction_dto.name,
    });
    await this.tractions_repository.persist_updated(updated);
    return { traction: updated.toPrimitives() };
  }

  async findAll(): Promise<{ tractions: PrimitiveTraction[] }> {
    const items = await this.tractions_repository.findAll();
    return { tractions: items.map((t) => t.toPrimitives()) };
  }

  async findOne(id: string): Promise<{ traction: PrimitiveTraction }> {
    const traction = await this.tractions_repository.findOne(id);
    if (!traction) {
      throw new TractionNotFoundException(id);
    }
    return { traction: traction.toPrimitives() };
  }

  async remove(id: string): Promise<void> {
    await this.tractions_repository.remove(id);
  }
}
