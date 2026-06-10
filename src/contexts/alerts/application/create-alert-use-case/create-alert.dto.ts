import type { AlertFilters } from "../../domain/filters/alert-filters";
import { AlertFiltersDto } from "../alert-filters.dto";

export class CreateAlertDto extends AlertFiltersDto {
  profile_id: string;
  name: string;
  email?: string;
  phone: string;
  phone_code: string;
  filters?: AlertFilters;
}
