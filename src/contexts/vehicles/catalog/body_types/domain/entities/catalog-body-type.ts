import { slugify } from "@/src/contexts/shared/slugify-string/slugify";

export interface PrimitiveCatalogBodyType {
  id?: number;
  body_type_id: number;
  doors: number;
  name: string;
  slug: string;
  created_at?: Date;
}

export class CatalogBodyType {
  constructor(private readonly primitive: PrimitiveCatalogBodyType) {}

  static create(payload: {
    body_type_id: number;
    doors: number;
    name: string;
  }): CatalogBodyType {
    const name = payload.name.trim();
    return new CatalogBodyType({
      body_type_id: payload.body_type_id,
      doors: payload.doors,
      name,
      slug: slugify(name),
    });
  }

  update(
    payload: Partial<
      Pick<PrimitiveCatalogBodyType, "body_type_id" | "doors" | "name">
    >,
  ): CatalogBodyType {
    const name =
      payload.name !== undefined ? payload.name.trim() : this.primitive.name;
    const next_slug =
      payload.name !== undefined ? slugify(name) : this.primitive.slug;
    return new CatalogBodyType({
      ...this.primitive,
      ...payload,
      name,
      slug: next_slug,
    });
  }

  static fromPrimitives(p: PrimitiveCatalogBodyType): CatalogBodyType {
    return new CatalogBodyType(p);
  }

  toPrimitives(): PrimitiveCatalogBodyType {
    return { ...this.primitive };
  }
}
