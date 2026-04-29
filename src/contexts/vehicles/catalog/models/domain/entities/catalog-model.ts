import { slugify } from "@/src/contexts/shared/slugify-string/slugify";

export interface PrimitiveCatalogModel {
  id?: number;
  make_id: number;
  model_id: number;
  name: string;
  slug: string;
  created_at?: Date;
}

export class CatalogModel {
  constructor(private readonly primitive: PrimitiveCatalogModel) {}

  static create(payload: {
    make_id: number;
    model_id: number;
    name: string;
  }): CatalogModel {
    const name = payload.name.trim();
    return new CatalogModel({
      make_id: payload.make_id,
      model_id: payload.model_id,
      name,
      slug: slugify(name),
    });
  }

  update(
    payload: Partial<
      Pick<PrimitiveCatalogModel, "make_id" | "model_id" | "name">
    >,
  ): CatalogModel {
    const name =
      payload.name !== undefined ? payload.name.trim() : this.primitive.name;
    const next_slug =
      payload.name !== undefined ? slugify(name) : this.primitive.slug;
    return new CatalogModel({
      ...this.primitive,
      ...payload,
      name,
      slug: next_slug,
    });
  }

  static fromPrimitives(p: PrimitiveCatalogModel): CatalogModel {
    return new CatalogModel(p);
  }

  toPrimitives(): PrimitiveCatalogModel {
    return { ...this.primitive };
  }
}
