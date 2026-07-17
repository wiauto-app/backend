import { ActiveFilterItem } from "../types/active-filter-item";

export const trim_slug_array = (slugs: string[]): string[] =>
  slugs.map((slug) => slug.trim()).filter((slug) => slug.length > 0);

export const has_non_empty_slug_array = (
  value: string[] | undefined,
): value is string[] => Array.isArray(value) && trim_slug_array(value).length > 0;

export const order_active_filter_items_by_slugs = (
  items: ActiveFilterItem[],
  slugs: string[],
): ActiveFilterItem[] => {
  const by_slug = new Map(items.map((item) => [item.slug, item]));
  return slugs
    .map((slug) => by_slug.get(slug))
    .filter((item): item is ActiveFilterItem => item != null);
};

export const order_active_filter_items_by_ids = (
  items: ActiveFilterItem[],
  ids: string[],
): ActiveFilterItem[] => {
  const by_id = new Map(items.map((item) => [String(item.id), item]));
  return ids
    .map((id) => by_id.get(id))
    .filter((item): item is ActiveFilterItem => item != null);
};
