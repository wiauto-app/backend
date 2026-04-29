import { Service } from "../entities/services";

export abstract class ServicesRepository {
  abstract findOne(id: string): Promise<Service | null>;
  abstract findAll(): Promise<Service[]>;
  abstract save(service: Service): Promise<void>;
  abstract persist_updated(service: Service): Promise<void>;
  abstract remove(id: string): Promise<void>;
}
