import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { Cuota } from "../../domain/entities/cuota";
import { CuotaNotFoundException } from "../../domain/exceptions/cuota-not-found.exception";
import { CuotasRepository } from "../../domain/repositories/cuotas.repository";
import { CuotaEntity } from "../persistence/cuota.entity";

@Injectable()
export class TypeormCuotaRepository extends CuotasRepository {
  constructor(
    @InjectRepository(CuotaEntity)
    private readonly repo: Repository<CuotaEntity>,
  ) {
    super();
  }

  async findAll(): Promise<Cuota[]> {
    const rows = await this.repo.find({ order: { value: "ASC" } });
    return rows.map((row) =>
      Cuota.fromPrimitives({
        id: row.id,
        name: row.name,
        slug: row.slug,
        value: row.value,
        created_at: row.created_at,
        updated_at: row.updated_at,
      }),
    );
  }

  async findOne(id: string): Promise<Cuota | null> {
    const row = await this.repo.findOne({ where: { id } });
    if (!row) {
      return null;
    }
    return Cuota.fromPrimitives({
      id: row.id,
      name: row.name,
      slug: row.slug,
      value: row.value,
      created_at: row.created_at,
      updated_at: row.updated_at,
    });
  }

  async save(cuota: Cuota): Promise<void> {
    const p = cuota.toPrimitives();
    const existing = await this.repo.findOne({ where: { id: p.id } });
    if (existing) {
      const preloaded = await this.repo.preload({
        id: p.id,
        name: p.name,
        slug: p.slug,
        value: p.value,
        created_at: p.created_at,
        updated_at: p.updated_at,
      });
      if (!preloaded) {
        throw new CuotaNotFoundException(p.id);
      }
      await this.repo.save(preloaded);
      return;
    }
    await this.repo.save(
      this.repo.create({
        id: p.id,
        name: p.name,
        slug: p.slug,
        value: p.value,
        created_at: p.created_at,
        updated_at: p.updated_at,
      }),
    );
  }

  async remove(id: string): Promise<void> {
    await this.repo.delete(id);
  }
}
