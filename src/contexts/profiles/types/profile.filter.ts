import { PaginationDto } from "@/src/contexts/shared/dto/pagination.dto";
import { PaginationFilter } from "@/src/contexts/shared/types/pagination.filter";

export interface ProfileFilterOptions extends PaginationDto {
  name?: string;
  role_id?: string;
  email?: string;
}

export class ProfileFilter extends PaginationFilter {
  readonly name?: string;
  readonly role_id?: string;
  readonly email?: string;
  constructor(options: ProfileFilterOptions) {
    const { page, limit, order_direction, query, order_by, name, role_id, email } = options;
    super(page ?? 1, limit ?? 10, order_direction, query, order_by);
    this.name = name;
    this.role_id = role_id;
    this.email = email;
  }
}
