import { PaginationDto } from "@/src/contexts/shared/application/dtos/pagination.dto";
import { PaginationFilter } from "@/src/contexts/shared/domain/filters/pagination.filter";

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
    super(page, limit, order_direction, query, order_by);
    this.name = name;
    this.role_id = role_id;
    this.email = email;
  }
}
