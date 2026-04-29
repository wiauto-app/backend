import { Traction } from "../entities/traction";

export abstract class TractionsRepository {
  abstract findOne(id: string): Promise<Traction | null>;
  abstract findAll(): Promise<Traction[]>;
  abstract save(traction: Traction): Promise<void>;
  abstract persist_updated(traction: Traction): Promise<void>;
  abstract remove(id: string): Promise<void>;
}
