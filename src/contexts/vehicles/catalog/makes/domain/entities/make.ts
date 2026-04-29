import { slugify } from "@/src/contexts/shared/slugify-string/slugify";

export interface PrimitiveMake {
  id?: number;
  name: string;
  slug: string;
  created_at?: Date;
}

export class Make {
  constructor(private readonly primitive_make: PrimitiveMake) {}

  static create(payload: { name: string }): Make {
    const name = payload.name.trim();
    return new Make({
      name,
      slug: slugify(name),
    });
  }

  update(payload: { name: string }): Make {
    const name = payload.name.trim();
    return new Make({
      ...this.primitive_make,
      name,
      slug: slugify(name),
    });
  }

  static fromPrimitives(primitive: PrimitiveMake): Make {
    return new Make(primitive);
  }

  toPrimitives(): PrimitiveMake {
    return { ...this.primitive_make };
  }
}
