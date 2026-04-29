import { CatalogBodyType } from "../entities/catalog-body-type";

export abstract class CatalogBodyTypesRepository {
  abstract findOne(id: number): Promise<CatalogBodyType | null>;
  abstract findAll(): Promise<CatalogBodyType[]>;
  abstract save(row: CatalogBodyType): Promise<CatalogBodyType>;
  abstract remove(id: number): Promise<void>;
}
