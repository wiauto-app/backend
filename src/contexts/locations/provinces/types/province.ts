import { slugify } from "@/src/contexts/shared/slugify-string/slugify";

export interface PrimitiveProvince {
  id: number;
  ogc_fid: number;
  cod_prov: string;
  name: string;
  cod_ccaa: string;
  slug: string;
  cartodb_id: number | null;
  image_url: string | null;
}

export class Province {
  constructor(private readonly primitive: PrimitiveProvince) {}

  update(payload: { name?: string; image_url?: string | null }): Province {
    const name = payload.name ?? this.primitive.name;
    const image_url =
      payload.image_url !== undefined
        ? payload.image_url
        : this.primitive.image_url;
    const name_trim = name.trim();
    const base = name_trim || `prov-${this.primitive.cod_prov}`;
    const slug = slugify(base) || slugify(`prov-${this.primitive.cod_prov}`);

    return new Province({
      ...this.primitive,
      name,
      image_url,
      slug,
    });
  }

  static fromPrimitives(primitive: PrimitiveProvince): Province {
    return new Province(primitive);
  }

  toPrimitives(): PrimitiveProvince {
    return { ...this.primitive };
  }
}
