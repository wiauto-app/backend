import { FindOptionsOrder, ObjectLiteral, Repository } from "typeorm";

import { CatalogPaginationFilter } from "../../domain/filters/catalog-pagination.filter";
import { PaginatedResult } from "../../domain/value-objects/paginated-result.vo";
import { getPaginationProps } from "../../dto/getPaginationProps";

export async function run_paginated_typeorm_find<Entity extends ObjectLiteral, Domain>(params: {
  repository: Repository<Entity>;
  filter: CatalogPaginationFilter;
  map_row: (row: Entity) => Domain;
  allowed_sort_keys: Set<string>;
  default_sort_key: string;
}): Promise<PaginatedResult<Domain>> {
  const { repository, filter, map_row, allowed_sort_keys, default_sort_key } = params;
  const { skip, take, order_column, direction } = getPaginationProps(filter, default_sort_key);
  const sort_key = allowed_sort_keys.has(order_column) ? order_column : default_sort_key;
  const [rows, total] = await repository.findAndCount({
    skip,
    take,
    order: { [sort_key]: direction } as FindOptionsOrder<Entity>,
  });
  return new PaginatedResult(rows.map(map_row), total, filter.page, filter.limit);
}
