import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { CatalogPaginationFilter } from "@/src/contexts/shared/domain/filters/catalog-pagination.filter";
import { PaginatedResult } from "@/src/contexts/shared/domain/value-objects/paginated-result.vo";
import { PaginationHttpDto } from "@/src/contexts/shared/infrastructure/http-dtos/pagination.http-dto";
import { Make, PrimitiveMake } from "../../domain/entities/make";
import { MakesRepository } from "../../domain/repositories/makes.repository";
import { MakeNotFoundException } from "../../domain/exceptions/make-not-found.exception";
import { CreateMakeDto } from "./dto/create-make.dto";
import { UpdateMakeDto } from "./dto/update-make.dto";

@Injectable()
export class MakesUseCase {
  constructor(private readonly makes_repository: MakesRepository) {}

  async create(dto: CreateMakeDto): Promise<{ make: PrimitiveMake }> {
    const saved = await this.makes_repository.save(Make.create(dto));
    return { make: saved.toPrimitives() };
  }

  async update(
    id: number,
    dto: UpdateMakeDto,
  ): Promise<{ make: PrimitiveMake }> {
    const existing = await this.makes_repository.findOne(id);
    if (!existing) {
      throw new MakeNotFoundException(id);
    }
    const prev = existing.toPrimitives();
    const next_name = dto.name ?? prev.name!;
    const saved = await this.makes_repository.save(existing.update({ name: next_name }));
    return { make: saved.toPrimitives() };
  }

  async findAll(
    query: PaginationHttpDto,
  ): Promise<PaginatedResult<PrimitiveMake>> {
    const filter = new CatalogPaginationFilter({ ...query });
    const page = await this.makes_repository.find_all(filter);
    return page.map((m) => m.toPrimitives());
  }

  async findOne(id: number): Promise<{ make: PrimitiveMake }> {
    const make = await this.makes_repository.findOne(id);
    if (!make) {
      throw new MakeNotFoundException(id);
    }
    return { make: make.toPrimitives() };
  }

  async remove(id: number): Promise<void> {
    await this.makes_repository.remove(id);
  }
}
