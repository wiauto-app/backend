import { PaginationDto } from "@/src/contexts/shared/dto/pagination.dto";
import { PaginationFilter } from "@/src/contexts/shared/types/pagination.filter";

export interface ProfileFilterOptions extends PaginationDto {
  name?: string;
  last_name?: string;
  email?: string;
}

export class ProfileFilter extends PaginationFilter {
  readonly name?: string;
  readonly last_name?: string;
  readonly email?: string;
  constructor(options: ProfileFilterOptions) {
    const { page, limit, order_direction, query, order_by, name, last_name, email } =
      options;
    super(page ?? 1, limit ?? 10, order_direction, query, order_by);
    this.name = name;
    this.last_name = last_name;
    this.email = email;
  }
}
