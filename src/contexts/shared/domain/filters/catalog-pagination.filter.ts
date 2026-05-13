import { PaginationDto } from "../../application/dtos/pagination.dto";
import { PaginationFilter } from "./pagination.filter";



/** Listados de catálogo sin filtros de dominio extra (solo paginación / orden / búsqueda genérica en `query` si el repo la aplica). */
export class CatalogPaginationFilter extends PaginationFilter {
  constructor(options: PaginationDto ) {
    super(
      options.page,
      options.limit,
      options.order_direction,
      options.query,
      options.order_by,
    );
  }
}
