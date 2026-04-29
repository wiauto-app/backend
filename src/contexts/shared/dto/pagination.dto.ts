

export class PaginationDto {

  query?: string;

  page: number;
  limit: number;

  order_by?: string;
  order_direction?: "asc" | "desc";
}