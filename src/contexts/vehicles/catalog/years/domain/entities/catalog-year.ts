import { slugify } from "@/src/contexts/shared/slugify-string/slugify";

export interface PrimitiveCatalogYear {
  id?: number;
  year: number;
  slug: string;
  created_at?: Date;
}

export class CatalogYear {
  constructor(private readonly primitive: PrimitiveCatalogYear) {}

  static create(payload: { year: number }): CatalogYear {
    const year = payload.year;
    return new CatalogYear({
      year,
      slug: slugify(String(year)),
    });
  }

  update(payload: { year: number }): CatalogYear {
    const year = payload.year;
    return new CatalogYear({
      ...this.primitive,
      year,
      slug: slugify(String(year)),
    });
  }

  static fromPrimitives(primitive: PrimitiveCatalogYear): CatalogYear {
    return new CatalogYear(primitive);
  }

  toPrimitives(): PrimitiveCatalogYear {
    return { ...this.primitive };
  }
}
