import { envs } from "@/src/common/envs";

export const VEHICLE_HERO_INDEX_NAME = envs.OPENSEARCH_INDEX_HERO;

export const vehicle_hero_index_mappings = {
  settings: {
    number_of_shards: 1,
    number_of_replicas: 0,
  },
  mappings: {
    dynamic: "strict" as const,
    properties: {
      vehicle_id: { type: "keyword" },
      status: { type: "keyword" },
      deleted_at: { type: "date", format: "strict_date_optional_time||epoch_millis" },
      make_id: { type: "integer" },
      make_slug: { type: "keyword" },
      make_name: {
        type: "text",
        fields: { keyword: { type: "keyword" } },
      },
      model_id: { type: "integer" },
      model_slug: { type: "keyword" },
      model_name: {
        type: "text",
        fields: { keyword: { type: "keyword" } },
      },
      province_id: { type: "integer" },
      province_slug: { type: "keyword" },
      province_name: {
        type: "text",
        fields: { keyword: { type: "keyword" } },
      },
      municipality_id: { type: "integer" },
      municipality_slug: { type: "keyword" },
      municipality_name: {
        type: "text",
        fields: { keyword: { type: "keyword" } },
      },
      active_price: { type: "integer" },
      location: { type: "geo_point" },
    },
  },
};
