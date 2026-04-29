import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CatalogYear } from "../../domain/entities/catalog-year";
import { CatalogYearsRepository } from "../../domain/repositories/catalog-years.repository";
import { CatalogYearEntity } from "../persistence/catalog-year.entity";
import { CatalogYearNotFoundException } from "../../domain/exceptions/catalog-year-not-found.exception";

export class TypeormCatalogYearRepository extends CatalogYearsRepository {
  constructor(
    @InjectRepository(CatalogYearEntity)
    private readonly repo: Repository<CatalogYearEntity>,
  ) {
    super();
  }

  async findAll(): Promise<CatalogYear[]> {
    const rows = await this.repo.find({ order: { year: "ASC" } });
    return rows.map((row) =>
      CatalogYear.fromPrimitives({
        id: row.id,
        year: row.year,
        slug: row.slug,
        created_at: row.created_at,
      }),
    );
  }

  async findOne(id: number): Promise<CatalogYear | null> {
    const row = await this.repo.findOne({ where: { id } });
    if (!row) {
      return null;
    }
    return CatalogYear.fromPrimitives({
      id: row.id,
      year: row.year,
      slug: row.slug,
      created_at: row.created_at,
    });
  }

  async save(year: CatalogYear): Promise<CatalogYear> {
    const p = year.toPrimitives();
    if (p.id === undefined) {
      const saved = await this.repo.save(
        this.repo.create({ year: p.year, slug: p.slug }),
      );
      return CatalogYear.fromPrimitives({
        id: saved.id,
        year: saved.year,
        slug: saved.slug,
        created_at: saved.created_at,
      });
    }
    const row = await this.repo.preload({ id: p.id, year: p.year, slug: p.slug });
    if (!row) {
      throw new CatalogYearNotFoundException(p.id);
    }
    const saved = await this.repo.save(row);
    return CatalogYear.fromPrimitives({
      id: saved.id,
      year: saved.year,
      slug: saved.slug,
      created_at: saved.created_at,
    });
  }

  async remove(id: number): Promise<void> {
    await this.repo.delete(id);
  }
}
