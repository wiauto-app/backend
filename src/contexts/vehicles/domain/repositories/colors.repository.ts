import { Color } from "../entities/color";

export abstract class ColorsRepository {
  abstract findOne(id: string): Promise<Color | null>;
  abstract findAll(): Promise<Color[]>;
  abstract save(color: Color): Promise<void>;
  abstract update(id: string, name: string, hex_code: string): Promise<void>;
  abstract remove(id: string): Promise<void>;
}
