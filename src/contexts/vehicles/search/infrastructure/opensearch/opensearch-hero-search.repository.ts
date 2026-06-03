import { Injectable, Logger } from "@nestjs/common";
import { Inject } from "@nestjs/common";
import type { Client } from "@opensearch-project/opensearch";

import { HeroSearchRepository } from "../../domain/ports/hero-search.repository";
import type { VehicleHeroSearchDocument } from "../../domain/entities/vehicle-hero-search-document";
import type { HeroSearchFacetFilter } from "../../domain/filters/hero-search-facet.filter";
import type {
  HeroCatalogFacetItem,
  HeroFacetsResult,
  HeroPriceRangeFacetItem,
} from "../../domain/read-models/hero-facet-item";
import {
  formatHeroPriceUntilLabel,
  HERO_PRICE_UNTIL_OPTIONS,
} from "../../domain/constants/hero-price-until-options";
import {
  vehicle_hero_index_mappings,
  VEHICLE_HERO_INDEX_NAME,
} from "./vehicle-hero-index.mapping";
import {
  mapHeroCatalogFacetBucket,
  type HeroFacetTermsBucket,
} from "./map-hero-catalog-facet-bucket";
import { OPENSEARCH_CLIENT } from "./opensearch-client.factory";

const SLUG_FIELD_BY_FACET = {
  makes: "make_slug",
  models: "model_slug",
  provinces: "province_slug",
  municipalities: "municipality_slug",
} as const;

const META_PREFIX_BY_FACET = {
  makes: "make",
  models: "model",
  provinces: "province",
  municipalities: "municipality",
} as const;

@Injectable()
export class OpenSearchHeroSearchRepository extends HeroSearchRepository {
  private readonly logger = new Logger(OpenSearchHeroSearchRepository.name);

  constructor(
    @Inject(OPENSEARCH_CLIENT)
    private readonly client: Client,
  ) {
    super();
  }

  async ensureIndex(): Promise<void> {
    const exists = await this.client.indices.exists({
      index: VEHICLE_HERO_INDEX_NAME,
    });

    if (exists.body) {
      return;
    }

    await this.client.indices.create({
      index: VEHICLE_HERO_INDEX_NAME,
      body: vehicle_hero_index_mappings as Record<string, unknown>,
    });
  }

  async indexDocument(document: VehicleHeroSearchDocument): Promise<void> {
    await this.ensureIndex();
    await this.client.index({
      index: VEHICLE_HERO_INDEX_NAME,
      id: document.vehicle_id,
      body: document,
      refresh: true,
    });
  }

  async deleteDocument(vehicle_id: string): Promise<void> {
    try {
      await this.client.delete({
        index: VEHICLE_HERO_INDEX_NAME,
        id: vehicle_id,
        refresh: true,
      });
    } catch (error: unknown) {
      const status = (error as { statusCode?: number }).statusCode;
      if (status === 404) {
        return;
      }
      throw error;
    }
  }

  async bulkIndexDocuments(
    documents: VehicleHeroSearchDocument[],
  ): Promise<{ indexed: number; errors: number }> {
    await this.ensureIndex();

    if (documents.length === 0) {
      return { indexed: 0, errors: 0 };
    }

    const body = documents.flatMap((document) => [
      { index: { _index: VEHICLE_HERO_INDEX_NAME, _id: document.vehicle_id } },
      document,
    ]);

    const response = await this.client.bulk({ body, refresh: true });
    const items = response.body.items
    const errors = items.filter((item) => item.index.error).length;

    if (errors > 0) {
      this.logger.warn(`Bulk index completed with ${errors} errors`);
    }

    return { indexed: documents.length - errors, errors };
  }

  async getFacets(filter: HeroSearchFacetFilter): Promise<HeroFacetsResult> {
    await this.ensureIndex();

    const exclude_until_price = filter.facet === "price_ranges";
    const base_filter = this.buildBaseFilters(filter, exclude_until_price);

    if (filter.facet === "price_ranges") {
      return this.getPriceRangeFacets(base_filter);
    }

    const meta_prefix = META_PREFIX_BY_FACET[filter.facet];
    const slug_field = SLUG_FIELD_BY_FACET[filter.facet];
    const search = filter.search?.trim();
    const source_includes = [
      `${meta_prefix}_id`,
      `${meta_prefix}_slug`,
      `${meta_prefix}_name`,
    ];

    if (filter.facet === "models") {
      source_includes.push("make_id");
    }

    const terms_agg = {
      terms: {
        field: slug_field,
        size: 200,
        order: { _count: "desc" as const },
      },
      aggs: {
        meta: {
          top_hits: {
            size: 1,
            _source: {
              includes: source_includes,
            },
          },
        },
      },
    };

    const aggs_body = search
      ? {
          facet_values: {
            filter: {
              wildcard: {
                [`${meta_prefix}_name.keyword`]: {
                  value: `*${search.toLowerCase()}*`,
                  case_insensitive: true,
                },
              },
            },
            aggs: {
              filtered_terms: terms_agg,
            },
          },
        }
      : { facet_values: terms_agg };

    const response = await this.client.search({
      index: VEHICLE_HERO_INDEX_NAME,
      body: {
        size: 0,
        query: {
          bool: {
            filter: base_filter as Record<string, unknown>[],
          },
        },
        aggs: aggs_body,
      } as Record<string, unknown>,
    });

    const facet_agg = response.body.aggregations?.facet_values as
      | {
          buckets?: HeroFacetTermsBucket[];
          filtered_terms?: { buckets?: HeroFacetTermsBucket[] };
        }
      | undefined;

    const buckets =
      facet_agg?.filtered_terms?.buckets ?? facet_agg?.buckets ?? [];

    const items = buckets
      .map((bucket) => mapHeroCatalogFacetBucket(meta_prefix, bucket))
      .filter((item): item is HeroCatalogFacetItem => item !== null);

    return { facet: filter.facet, items };
  }

  private buildBaseFilters(
    filter: HeroSearchFacetFilter,
    exclude_until_price = false,
  ): unknown[] {
    const clauses: unknown[] = [
      { term: { status: "active" } },
      { bool: { must_not: { exists: { field: "deleted_at" } } } },
    ];

    if (filter.make_slugs?.length) {
      clauses.push({ terms: { make_slug: filter.make_slugs } });
    }

    if (filter.model_slugs?.length) {
      clauses.push({ terms: { model_slug: filter.model_slugs } });
    }

    if (filter.province_slug) {
      clauses.push({ term: { province_slug: filter.province_slug } });
    }

    if (filter.municipality_slug) {
      clauses.push({ term: { municipality_slug: filter.municipality_slug } });
    }

    if (!exclude_until_price && filter.until_price !== undefined) {
      clauses.push({
        range: { active_price: { lte: filter.until_price } },
      });
    }

    return clauses;
  }

  private async getPriceRangeFacets(
    base_filter: unknown[],
  ): Promise<HeroFacetsResult> {
    const aggs = Object.fromEntries(
      HERO_PRICE_UNTIL_OPTIONS.map((until_price) => [
        `until_${until_price}`,
        {
          filter: {
            bool: {
              filter: [
                ...base_filter,
                { range: { active_price: { lte: until_price } } },
              ],
            },
          },
        },
      ]),
    );

    const response = await this.client.search({
      index: VEHICLE_HERO_INDEX_NAME,
      body: {
        size: 0,
        query: { bool: { filter: base_filter as Record<string, unknown>[] } },
        aggs,
      } as Record<string, unknown>,
    });

    const items: HeroPriceRangeFacetItem[] = HERO_PRICE_UNTIL_OPTIONS.map(
      (until_price) => {
        const agg_key = `until_${until_price}`;
        const doc_count =
          (
            response.body.aggregations?.[agg_key] as
              | { doc_count?: number }
              | undefined
          )?.doc_count ?? 0;

        return {
          until_price,
          label: formatHeroPriceUntilLabel(until_price),
          vehicle_count: doc_count,
        };
      },
    );

    return { facet: "price_ranges", items };
  }
}
