import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";

import { Cuota, PrimitiveCuota } from "../../domain/entities/cuota";
import { CuotaNotFoundException } from "../../domain/exceptions/cuota-not-found.exception";
import { CuotasRepository } from "../../domain/repositories/cuotas.repository";
import { CreateCuotaDto } from "./dto/create-cuota.dto";
import { UpdateCuotaDto } from "./dto/update-cuota.dto";

@Injectable()
export class CuotasUseCase {
  constructor(private readonly cuotas_repository: CuotasRepository) {}

  async create(dto: CreateCuotaDto): Promise<{ cuota: PrimitiveCuota }> {
    const cuota = Cuota.create({ name: dto.name, value: dto.value });
    await this.cuotas_repository.save(cuota);
    return { cuota: cuota.toPrimitives() };
  }

  async update(
    id: string,
    dto: UpdateCuotaDto,
  ): Promise<{ cuota: PrimitiveCuota }> {
    const existing = await this.cuotas_repository.findOne(id);
    if (!existing) {
      throw new CuotaNotFoundException(id);
    }
    const prev = existing.toPrimitives();
    const updated = existing.update({
      name: dto.name !== undefined ? dto.name : prev.name,
      value: dto.value !== undefined ? dto.value : prev.value,
    });
    await this.cuotas_repository.save(updated);
    return { cuota: updated.toPrimitives() };
  }

  async findAll(): Promise<{ cuotas: PrimitiveCuota[] }> {
    const items = await this.cuotas_repository.findAll();
    return { cuotas: items.map((c) => c.toPrimitives()) };
  }

  async findOne(id: string): Promise<{ cuota: PrimitiveCuota }> {
    const row = await this.cuotas_repository.findOne(id);
    if (!row) {
      throw new CuotaNotFoundException(id);
    }
    return { cuota: row.toPrimitives() };
  }

  async remove(id: string): Promise<void> {
    await this.cuotas_repository.remove(id);
  }
}
