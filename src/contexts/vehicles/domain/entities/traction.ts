import { uuidv4 } from "@/src/contexts/shared/uuid-generator/uuid-generator";
import { slugify } from "@/src/contexts/shared/slugify-string/slugify";

export interface PrimitiveTraction {
  id: string;
  name: string;
  slug: string;
  created_at?: Date;
  updated_at?: Date;
}

export class Traction {
  constructor(private readonly primitive_traction: PrimitiveTraction) {}

  static create(payload: { name: string }): Traction {
    const name = payload.name.trim();
    return new Traction({
      id: uuidv4(),
      name,
      slug: slugify(name),
      created_at: new Date(),
      updated_at: new Date(),
    });
  }

  update(payload: { name?: string }): Traction {
    const next_name =
      payload.name === undefined
        ? this.primitive_traction.name
        : payload.name.trim();
    const next_slug =
      payload.name === undefined
        ? this.primitive_traction.slug
        : slugify(next_name);
    return new Traction({
      ...this.primitive_traction,
      name: next_name,
      slug: next_slug,
      updated_at: new Date(),
    });
  }

  static fromPrimitives(primitive: PrimitiveTraction): Traction {
    return new Traction(primitive);
  }

  toPrimitives(): PrimitiveTraction {
    return {
      id: this.primitive_traction.id,
      name: this.primitive_traction.name,
      slug: this.primitive_traction.slug,
      created_at: this.primitive_traction.created_at,
      updated_at: this.primitive_traction.updated_at,
    };
  }
}
