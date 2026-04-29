import { CatalogModel } from "../entities/catalog-model";

export abstract class CatalogModelsRepository {
  abstract findOne(id: number): Promise<CatalogModel | null>;
  abstract findAll(): Promise<CatalogModel[]>;
  abstract save(row: CatalogModel): Promise<CatalogModel>;
  abstract remove(id: number): Promise<void>;
}
