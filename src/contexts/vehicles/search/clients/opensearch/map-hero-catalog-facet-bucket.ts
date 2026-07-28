import type { HeroCatalogFacetItem } from "../../types/hero-facet-item";

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
    const make_slug = hit_source.make_slug;
    const make_name = hit_source.make_name;
    if (
      typeof make_id !== "number" ||
      typeof make_slug !== "string" ||
      typeof make_name !== "string"
    ) {
      return null;
    }
    item.make_id = make_id;
    item.make_slug = make_slug;
    item.make_name = make_name;
  }

  return item;
};
