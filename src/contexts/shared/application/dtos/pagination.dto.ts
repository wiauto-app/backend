export class PaginationDto {
  query?: string;

  /** Si no viene (p. ej. query HTTP), el caso de uso / `getPaginationProps` usan defaults. */
  page?: number;
  limit?: number;

  order_by?: string;
  order_direction?: "asc" | "desc";
}