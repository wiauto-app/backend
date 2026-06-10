import { AlertFiltersDto } from "../alert-filters.dto";

export class UpdateAlertDto extends AlertFiltersDto {
  alert_id: string;
  profile_id: string;
  name?: string;
}
