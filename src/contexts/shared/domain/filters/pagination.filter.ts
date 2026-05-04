

export class PaginationFilter {
  constructor(
    public readonly page: number,
    public readonly limit: number,
    public readonly query?: string,
    public readonly order_by?: string,
    public readonly order_direction?: "asc" | "desc",
  ) { }

  get skip(): number {
    return (this.page - 1) * this.limit;
  }

}