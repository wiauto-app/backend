import { Cuota } from "../entities/cuota";

export abstract class CuotasRepository {
  abstract findOne(id: string): Promise<Cuota | null>;
  abstract findAll(): Promise<Cuota[]>;
  abstract save(cuota: Cuota): Promise<void>;
  abstract remove(id: string): Promise<void>;
}
