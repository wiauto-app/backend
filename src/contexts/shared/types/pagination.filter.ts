

export class PaginationFilter {
  constructor(
    public readonly page: number,
    public readonly limit: number,
    public readonly order_direction: "ASC" | "DESC" = "ASC",
    public readonly query?: string,
    public readonly order_by?: string,  
    public readonly search?: string,
  ) { }

}