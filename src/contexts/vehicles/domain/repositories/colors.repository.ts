import { CatalogPaginationFilter } from "@/src/contexts/shared/domain/filters/catalog-pagination.filter";
import { PaginatedResult } from "@/src/contexts/shared/domain/value-objects/paginated-result.vo";

import { Color } from "../entities/color";

export abstract class ColorsRepository {
  abstract findOne(id: string): Promise<Color | null>;
  abstract find_all(filter: CatalogPaginationFilter): Promise<PaginatedResult<Color>>;
  abstract save(color: Color): Promise<void>;
  abstract update(id: string, name: string, hex_code: string): Promise<void>;
  abstract remove(id: string): Promise<void>;
}
