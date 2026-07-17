import {
  FindOptionsOrder,
  FindOptionsWhere,
  ILike,
  ObjectLiteral,
  Repository,
} from "typeorm";

import { CatalogPaginationFilter } from "../types/catalog-pagination.filter";
import { PaginatedResult } from "../types/paginated-result.vo";
import { getPaginationProps } from "../dto/getPaginationProps";

export async function runPaginatedTypeormFind<Entity extends ObjectLiteral, Domain>(params: {
  repository: Repository<Entity>;
  filter: CatalogPaginationFilter;
  map_row: (row: Entity) => Domain;
  allowed_sort_keys: Set<string>;
  default_sort_key: string;
  extra_filters?: FindOptionsWhere<Entity>;
  relations?: string[];
  search_column?: string;
}): Promise<PaginatedResult<Domain>> {
  const {
    repository,
    filter,
    map_row,
    allowed_sort_keys,
    default_sort_key,
    relations,
    search_column = "name",
    extra_filters,
  } = params;
  const { skip, take, order_column, direction } = getPaginationProps(
    filter,
    default_sort_key,
  );
  const search = filter.search?.trim();
  const sort_key = allowed_sort_keys.has(order_column) ? order_column : default_sort_key;
  const where: FindOptionsWhere<Entity> | undefined = search
    ? ({ [search_column]: ILike(`%${search}%`) } as FindOptionsWhere<Entity>)
    : undefined;
  const extra_where = extra_filters ? { ...where, ...extra_filters } : where;
  const [rows, total] = await repository.findAndCount({
    skip,
    take,
    order: { [sort_key]: direction } as FindOptionsOrder<Entity>,
    relations: relations ?? [],
    ...(extra_where ? { where: extra_where } : {}),
  });
  return new PaginatedResult(rows.map((row) => map_row(row)), total, filter.page, filter.limit);
}
