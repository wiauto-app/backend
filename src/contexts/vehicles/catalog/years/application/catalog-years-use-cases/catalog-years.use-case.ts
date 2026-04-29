import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import {
  CatalogYear,
  PrimitiveCatalogYear,
} from "../../domain/entities/catalog-year";
import { CatalogYearsRepository } from "../../domain/repositories/catalog-years.repository";
import { CatalogYearNotFoundException } from "../../domain/exceptions/catalog-year-not-found.exception";
import { CreateCatalogYearDto } from "./dto/create-catalog-year.dto";
import { UpdateCatalogYearDto } from "./dto/update-catalog-year.dto";

@Injectable()
export class CatalogYearsUseCase {
  constructor(private readonly repository: CatalogYearsRepository) {}

  async create(dto: CreateCatalogYearDto): Promise<{ year: PrimitiveCatalogYear }> {
    const saved = await this.repository.save(CatalogYear.create(dto));
    return { year: saved.toPrimitives() };
  }

  async update(
    id: number,
    dto: UpdateCatalogYearDto,
  ): Promise<{ year: PrimitiveCatalogYear }> {
    const existing = await this.repository.findOne(id);
    if (!existing) {
      throw new CatalogYearNotFoundException(id);
    }
    const prev = existing.toPrimitives();
    const next_year = dto.year ?? prev.year!;
    const saved = await this.repository.save(existing.update({ year: next_year }));
    return { year: saved.toPrimitives() };
  }

  async findAll(): Promise<{ years: PrimitiveCatalogYear[] }> {
    const items = await this.repository.findAll();
    return { years: items.map((y) => y.toPrimitives()) };
  }

  async findOne(id: number): Promise<{ year: PrimitiveCatalogYear }> {
    const row = await this.repository.findOne(id);
    if (!row) {
      throw new CatalogYearNotFoundException(id);
    }
    return { year: row.toPrimitives() };
  }

  async remove(id: number): Promise<void> {
    await this.repository.remove(id);
  }
}
