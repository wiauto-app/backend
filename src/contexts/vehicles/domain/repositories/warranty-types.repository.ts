import { WarrantyType } from "../entities/warranty-type";

export abstract class WarrantyTypesRepository {
  abstract findOne(id: string): Promise<WarrantyType | null>;
  abstract findAll(): Promise<WarrantyType[]>;
  abstract save(warranty_type: WarrantyType): Promise<void>;
  abstract persist_updated(warranty_type: WarrantyType): Promise<void>;
  abstract remove(id: string): Promise<void>;
}
