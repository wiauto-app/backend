import { Make } from "../entities/make";

export abstract class MakesRepository {
  abstract findOne(id: number): Promise<Make | null>;
  abstract findAll(): Promise<Make[]>;
  abstract save(make: Make): Promise<Make>;
  abstract remove(id: number): Promise<void>;
}
