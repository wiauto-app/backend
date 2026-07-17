export class PaginationDto {
  query?: string;
  page?: number = 1;
  limit?: number = 10;
  search?: string;
  order_by?: string;
  order_direction?: "ASC" | "DESC";
}
