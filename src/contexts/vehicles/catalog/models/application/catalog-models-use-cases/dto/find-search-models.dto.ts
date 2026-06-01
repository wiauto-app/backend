export class FindSearchModelsDto {
  make_id: number;
  search?: string;
  province_id?: string;
  since_price?: number;
  until_price?: number;
  page?: number;
  limit?: number;
  order_direction?: "ASC" | "DESC";
  query?: string;
  order_by?: string;
}
