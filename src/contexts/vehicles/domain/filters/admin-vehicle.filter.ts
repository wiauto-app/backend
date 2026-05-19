import { PaginationDto } from "@/src/contexts/shared/application/dtos/pagination.dto";
import { PaginationFilter } from "@/src/contexts/shared/domain/filters/pagination.filter";
import { PublisherType, StatusVehicle } from "../entities/vehicle";

export interface AdminVehicleFilterOptions extends PaginationDto {
  publisher_name?: string;
  publisher_email?: string;
  status?: StatusVehicle;
  since_created_at?: Date;
  until_created_at?: Date;
  since_updated_at?: Date;
  until_updated_at?: Date;
  since_expires_at?: Date;
  until_expires_at?: Date;
  is_featured?: boolean;
  publisher_type?: PublisherType;
  vehicle_type_id?: string;
}

export class AdminVehicleFilter
  extends PaginationFilter
  implements
    Omit<
      AdminVehicleFilterOptions,
      "page" | "limit" | "query" | "order_by" | "order_direction"
    >
{
  publisher_name?: string;
  publisher_email?: string;
  status?: StatusVehicle;
  since_created_at?: Date;
  until_created_at?: Date;
  since_updated_at?: Date;
  until_updated_at?: Date;
  since_expires_at?: Date;
  until_expires_at?: Date;
  is_featured?: boolean;
  publisher_type?: PublisherType;
  vehicle_type_id?: string;

  constructor(options: AdminVehicleFilterOptions) {
    const {
      page,
      limit,
      order_direction,
      query,
      order_by,
      ...admin_filters
    } = options;
    super(page, limit, order_direction, query, order_by);
    Object.assign(this, admin_filters);
  }
}
