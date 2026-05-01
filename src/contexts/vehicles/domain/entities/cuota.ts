import { slugify } from "@/src/contexts/shared/slugify-string/slugify";
import { uuidv4 } from "@/src/contexts/shared/uuid-generator/uuid-generator";

export interface PrimitiveCuota {
  id: string;
  name: string;
  slug: string;
  value: number;
  created_at?: Date;
  updated_at?: Date;
}

export class Cuota {
  constructor(private readonly primitive: PrimitiveCuota) {}

  static create(payload: { name: string; value: number }): Cuota {
    const name = payload.name.trim();
    return new Cuota({
      id: uuidv4(),
      name,
      slug: slugify(name),
      value: payload.value,
      created_at: new Date(),
      updated_at: new Date(),
    });
  }

  update(payload: { name?: string; value?: number }): Cuota {
    const name =
      payload.name !== undefined ? payload.name.trim() : this.primitive.name;
    const slug =
      payload.name !== undefined ? slugify(name) : this.primitive.slug;
    const value =
      payload.value !== undefined ? payload.value : this.primitive.value;
    return new Cuota({
      ...this.primitive,
      name,
      slug,
      value,
      updated_at: new Date(),
    });
  }

  static fromPrimitives(primitive: PrimitiveCuota): Cuota {
    return new Cuota(primitive);
  }

  toPrimitives(): PrimitiveCuota {
    return { ...this.primitive };
  }
}
