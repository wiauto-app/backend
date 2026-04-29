import { CatalogYear } from "../entities/catalog-year";

export abstract class CatalogYearsRepository {
  abstract findOne(id: number): Promise<CatalogYear | null>;
  abstract findAll(): Promise<CatalogYear[]>;
  abstract save(year: CatalogYear): Promise<CatalogYear>;
  abstract remove(id: number): Promise<void>;
}
