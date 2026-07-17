import { slugify } from "@/src/contexts/shared/slugify-string/slugify";

export interface PrimitiveCommunity {
  id: number;
  ogc_fid: number;
  cod_ccaa: string;
  noml_ccaa: string | null;
  name: string | null;
  slug: string;
  cartodb_id: number | null;
  image_url: string | null;
}

export class Community {
  constructor(private readonly primitive: PrimitiveCommunity) {}

  update(payload: { name?: string | null; image_url?: string | null }): Community {
    const name =
      payload.name !== undefined ? payload.name : this.primitive.name;
    const image_url =
      payload.image_url !== undefined
        ? payload.image_url
        : this.primitive.image_url;
    const name_trim = (name ?? "").trim();
    const noml_trim = (this.primitive.noml_ccaa ?? "").trim();
    const base = name_trim || noml_trim || `ccaa-${this.primitive.cod_ccaa}`;
    const slug = slugify(base) || slugify(`ccaa-${this.primitive.cod_ccaa}`);

    return new Community({
      ...this.primitive,
      name,
      image_url,
      slug,
    });
  }

  static fromPrimitives(primitive: PrimitiveCommunity): Community {
    return new Community(primitive);
  }

  toPrimitives(): PrimitiveCommunity {
    return { ...this.primitive };
  }
}
