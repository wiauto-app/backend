import type { AlertFilters } from "../types/alert-filters";
import type { AlertFiltersDto } from "./alert-filters.dto";

export interface CreateAlertDto extends Partial<AlertFiltersDto> {
  profile_id: string | null;
  name?: string;
  email: string;
  phone: string;
  phone_code: string;
  filters?: AlertFilters;
}
