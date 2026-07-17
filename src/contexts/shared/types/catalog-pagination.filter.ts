import { PaginationDto } from "../dto/pagination.dto";
import { PaginationFilter } from "./pagination.filter";



/** Listados de catálogo sin filtros de dominio extra (solo paginación / orden / búsqueda genérica en `query` si el repo la aplica). */
export class CatalogPaginationFilter extends PaginationFilter {
  readonly make_id?: number;
  readonly model_id?: number;
  readonly body_type_id?: number;
  readonly fuel_type_id?: number;
  readonly year_id?: number;
  constructor(
    options: PaginationDto & {
      make_id?: number;
      model_id?: number;
      body_type_id?: number;
      fuel_type_id?: number;
      year_id?: number;
    },
  ) {
    const { make_id, model_id, body_type_id, fuel_type_id, year_id, ...rest } = options;
    super(options.page ?? 1, options.limit ?? 10,
      options.order_direction,
      rest.query,
      rest.order_by,
      rest.search,
    );
    this.make_id = make_id;
    this.model_id = model_id;
    this.body_type_id = body_type_id;
    this.fuel_type_id = fuel_type_id;
    this.year_id = year_id;
  }
}
