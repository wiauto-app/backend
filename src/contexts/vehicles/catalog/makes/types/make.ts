import { slugify } from "@/src/contexts/shared/slugify-string/slugify";

export interface PrimitiveMake {
  id?: number;
  name: string;
  slug: string;
  image_url?: string | null;
  created_at?: Date;
  vehicle_count?: number;
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

  update(payload: { name?: string; image_url?: string | null }): Make {
    const name = (payload.name ?? this.primitive_make.name).trim();
    const image_url =
      payload.image_url === undefined
        ? (this.primitive_make.image_url ?? null)
        : payload.image_url;
    const name_changed = name !== this.primitive_make.name;
    const slug = name_changed ? slugify(name) : this.primitive_make.slug;

    return new Make({
      ...this.primitive_make,
      name,
      slug,
      image_url,
    });
  }

  static fromPrimitives(primitive: PrimitiveMake): Make {
    return new Make(primitive);
  }

  toPrimitives(): PrimitiveMake {
    return { ...this.primitive_make };
  }
}
