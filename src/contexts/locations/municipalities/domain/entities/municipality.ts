import { slugify } from "@/src/contexts/shared/slugify-string/slugify";

export interface PrimitiveMunicipality {
  id: number;
  name: string | null;
  ineCode: string | null;
  nuts1: string | null;
  nuts2: string | null;
  nuts3: string | null;
  slug: string;
  image_url: string | null;
}

export class Municipality {
  constructor(private readonly primitive: PrimitiveMunicipality) {}

  update(payload: { name?: string | null; image_url?: string | null }): Municipality {
    const name =
      payload.name !== undefined ? payload.name : this.primitive.name;
    const image_url =
      payload.image_url !== undefined
        ? payload.image_url
        : this.primitive.image_url;
    const name_trim = (name ?? "").trim();
    const ine_trim = (this.primitive.ineCode ?? "").trim();
    const nuts3_trim = (this.primitive.nuts3 ?? "").trim();
    const nuts2_trim = (this.primitive.nuts2 ?? "").trim();
    const nuts1_trim = (this.primitive.nuts1 ?? "").trim();
    const base =
      name_trim ||
      (ine_trim ? `mun-${ine_trim}` : "") ||
      nuts3_trim ||
      nuts2_trim ||
      nuts1_trim ||
      `mun-${this.primitive.id}`;
    const fallback = ine_trim
      ? `mun-${ine_trim}`
      : `mun-${this.primitive.id}`;
    const slug = slugify(base) || slugify(fallback);

    return new Municipality({
      ...this.primitive,
      name,
      image_url,
      slug,
    });
  }

  static fromPrimitives(primitive: PrimitiveMunicipality): Municipality {
    return new Municipality(primitive);
  }

  toPrimitives(): PrimitiveMunicipality {
    return { ...this.primitive };
  }
}
