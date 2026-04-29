import { slugify } from "@/src/contexts/shared/slugify-string/slugify";

export interface PrimitiveCatalogVersion {
  id?: number;
  make_id: number;
  model_id: number;
  body_type_id: number;
  fuel_type_id: number;
  year_id: number;
  name: string;
  slug: string;
  created_at?: Date;
}

export class CatalogVersion {
  constructor(private readonly primitive: PrimitiveCatalogVersion) {}

  static create(
    payload: Omit<PrimitiveCatalogVersion, "id" | "created_at" | "slug">,
  ): CatalogVersion {
    const name = payload.name.trim();
    return new CatalogVersion({
      make_id: payload.make_id,
      model_id: payload.model_id,
      body_type_id: payload.body_type_id,
      fuel_type_id: payload.fuel_type_id,
      year_id: payload.year_id,
      name,
      slug: slugify(name),
    });
  }

  update(
    payload: Partial<
      Omit<PrimitiveCatalogVersion, "id" | "created_at" | "slug">
    >,
  ): CatalogVersion {
    const name =
      payload.name !== undefined ? payload.name.trim() : this.primitive.name;
    const next_slug =
      payload.name !== undefined ? slugify(name) : this.primitive.slug;
    return new CatalogVersion({
      ...this.primitive,
      ...payload,
      name,
      slug: next_slug,
    });
  }

  static fromPrimitives(p: PrimitiveCatalogVersion): CatalogVersion {
    return new CatalogVersion(p);
  }

  toPrimitives(): PrimitiveCatalogVersion {
    return { ...this.primitive };
  }
}
