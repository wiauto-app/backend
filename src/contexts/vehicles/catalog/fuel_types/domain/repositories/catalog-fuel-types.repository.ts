import { CatalogFuelType } from "../entities/catalog-fuel-type";

export abstract class CatalogFuelTypesRepository {
  abstract findOne(id: number): Promise<CatalogFuelType | null>;
  abstract findAll(): Promise<CatalogFuelType[]>;
  abstract save(row: CatalogFuelType): Promise<CatalogFuelType>;
  abstract remove(id: number): Promise<void>;
}
