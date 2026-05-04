import { PaginationFilter } from "./pagination.filter";

export interface CatalogPaginationFilterOptions {
  page?: number;
  limit?: number;
  query?: string;
  order_by?: string;
  order_direction?: "asc" | "desc";
}

/** Listados de catálogo sin filtros de dominio extra (solo paginación / orden / búsqueda genérica en `query` si el repo la aplica). */
export class CatalogPaginationFilter extends PaginationFilter {
  constructor(options: CatalogPaginationFilterOptions = {}) {
    super(
      options.page ?? 1,
      options.limit ?? 10,
      options.query,
      options.order_by,
      options.order_direction,
    );
  }
}
