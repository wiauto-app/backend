import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { PaginationDto } from "@/src/contexts/shared/dto/pagination.dto";
import { CatalogPaginationFilter } from "@/src/contexts/shared/types/catalog-pagination.filter";
import { PaginatedResult } from "@/src/contexts/shared/types/paginated-result.vo";
import { Make, PrimitiveMake } from "../types/make";
import { MakeNotFoundException } from "../exceptions/make-not-found.exception";
import { SearchMakesFilter } from "../types/searchMakes.filter";
import { TypeormMakeRepository } from "../repositories/typeorm.make-repository";

export interface CreateMakeInput {
  name: string;
  image_url?: string | null;
}

export interface UpdateMakeInput {
  name?: string;
  image_url?: string | null;
}

export interface FindSearchMakesInput {
  search?: string;
  province_id?: string;
  since_price?: number;
  until_price?: number;
  page?: number;
  limit?: number;
  order_direction?: "ASC" | "DESC";
  query?: string;
  order_by?: string;
}

@Injectable()
export class MakesService {
  constructor(private readonly makes_repository: TypeormMakeRepository) {}

  async create(dto: CreateMakeInput): Promise<{ make: PrimitiveMake }> {
    const saved = await this.makes_repository.save(
      Make.create({ name: dto.name }),
    );
    return { make: saved.toPrimitives() };
  }

  async update(
    id: number,
    dto: UpdateMakeInput,
  ): Promise<{ make: PrimitiveMake }> {
    const existing = await this.makes_repository.findOne(id);
    if (!existing) {
      throw new MakeNotFoundException(id);
    }
    const prev = existing.toPrimitives();
    const saved = await this.makes_repository.save(
      existing.update({
        name: dto.name ?? prev.name,
        image_url:
          dto.image_url === undefined
            ? (prev.image_url ?? null)
            : dto.image_url,
      }),
    );
    return { make: saved.toPrimitives() };
  }

  async findAll(query: PaginationDto): Promise<PaginatedResult<PrimitiveMake>> {
    const filter = new CatalogPaginationFilter({ ...query });
    const page = await this.makes_repository.find_all(filter);
    return page.map((m) => m.toPrimitives());
  }

  async findOne(id: number): Promise<{ make: PrimitiveMake }> {
    const make = await this.findById(id);
    if (!make) {
      throw new MakeNotFoundException(id);
    }
    return { make };
  }

  async findById(id: number): Promise<PrimitiveMake | null> {
    const make = await this.makes_repository.findOne(id);
    return make ? make.toPrimitives() : null;
  }

  async remove(id: number): Promise<void> {
    await this.makes_repository.remove(id);
  }

  async findSearchMakes(
    dto: FindSearchMakesInput,
  ): Promise<{ makes: PrimitiveMake[] }> {
    const filter = new SearchMakesFilter({
      search: dto.search,
      province_id: dto.province_id,
      since_price: dto.since_price,
      until_price: dto.until_price,
      page: dto.page,
      limit: dto.limit,
      order_direction: dto.order_direction,
      query: dto.query,
      order_by: dto.order_by,
    });
    const makes = await this.makes_repository.findSearchMakes(filter);
    return {
      makes: makes.map((make) => make.toPrimitives()),
    };
  }
}
