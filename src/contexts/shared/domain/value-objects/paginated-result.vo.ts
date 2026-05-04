export class PaginatedResult<T> {
  constructor(
    public readonly data: T[],
    public readonly total: number,
    public readonly page: number,
    public readonly limit: number,
  ) {}

  get totalPages(): number {
    return Math.ceil(this.total / this.limit);
  }

  get hasNextPage(): boolean {
    return this.page < this.totalPages;
  }

  map<U>(mapper: (item: T) => U): PaginatedResult<U> {
    return new PaginatedResult(
      this.data.map(mapper),
      this.total,
      this.page,
      this.limit,
    );
  }
}