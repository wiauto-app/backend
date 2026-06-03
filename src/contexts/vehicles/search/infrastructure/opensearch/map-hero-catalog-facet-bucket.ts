import type { HeroCatalogFacetItem } from "../../domain/read-models/hero-facet-item";

export type HeroFacetTermsBucket = {
  key: string;
  doc_count: number;
  meta?: {
    hits?: {
      hits?: {
        _source?: Record<string, unknown>;
      }[];
    };
  };
};

export const mapHeroCatalogFacetBucket = (
  meta_prefix: string,
  bucket: HeroFacetTermsBucket,
): HeroCatalogFacetItem | null => {
  const hit_source = bucket.meta?.hits?.hits?.[0]?._source;

  if (!hit_source) {
    return null;
  }

  const id = hit_source[`${meta_prefix}_id`];
  const slug = hit_source[`${meta_prefix}_slug`];
  const name = hit_source[`${meta_prefix}_name`];

  if (typeof id !== "number" || typeof slug !== "string" || typeof name !== "string") {
    return null;
  }

  const item: HeroCatalogFacetItem = {
    id,
    slug,
    name,
    vehicle_count: bucket.doc_count,
  };

  if (meta_prefix === "model") {
    const make_id = hit_source.make_id;
    if (typeof make_id !== "number") {
      return null;
    }
    item.make_id = make_id;
  }

  return item;
};
