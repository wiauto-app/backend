import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Make } from "../../domain/entities/make";
import { MakesRepository } from "../../domain/repositories/makes.repository";
import { MakeEntity } from "../persistence/make.entity";
import { MakeNotFoundException } from "../../domain/exceptions/make-not-found.exception";

export class TypeormMakeRepository extends MakesRepository {
  constructor(
    @InjectRepository(MakeEntity)
    private readonly make_repository: Repository<MakeEntity>,
  ) {
    super();
  }

  async findAll(): Promise<Make[]> {
    const rows = await this.make_repository.find({ order: { id: "ASC" } });
    return rows.map((row) =>
      Make.fromPrimitives({
        id: row.id,
        name: row.name,
        slug: row.slug,
        created_at: row.created_at,
      }),
    );
  }

  async findOne(id: number): Promise<Make | null> {
    const row = await this.make_repository.findOne({ where: { id } });
    if (!row) {
      return null;
    }
    return Make.fromPrimitives({
      id: row.id,
      name: row.name,
      slug: row.slug,
      created_at: row.created_at,
    });
  }

  async save(make: Make): Promise<Make> {
    const p = make.toPrimitives();
    if (p.id === undefined) {
      const saved = await this.make_repository.save(
        this.make_repository.create({ name: p.name, slug: p.slug }),
      );
      return Make.fromPrimitives({
        id: saved.id,
        name: saved.name,
        slug: saved.slug,
        created_at: saved.created_at,
      });
    }
    const row = await this.make_repository.preload({
      id: p.id,
      name: p.name,
      slug: p.slug,
    });
    if (!row) {
      throw new MakeNotFoundException(p.id);
    }
    const saved = await this.make_repository.save(row);
    return Make.fromPrimitives({
      id: saved.id,
      name: saved.name,
      slug: saved.slug,
      created_at: saved.created_at,
    });
  }

  async remove(id: number): Promise<void> {
    await this.make_repository.delete(id);
  }
}
