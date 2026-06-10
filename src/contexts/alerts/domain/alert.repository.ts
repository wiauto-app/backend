import type { AlertFilters } from "./filters/alert-filters";
import { Alert } from "./entities/alert";

export abstract class AlertRepository {
  abstract save(alert: Alert): Promise<void>;
  abstract findOne(id: string): Promise<Alert | null>;
  abstract findAllByProfileId(profile_id: string): Promise<Alert[]>;
  abstract findByProfileIdAndSourceVehicleId(
    profile_id: string,
    source_vehicle_id: string,
  ): Promise<Alert | null>;
  abstract filtersMatch(
    profile_id: string,
    filters: AlertFilters,
  ): Promise<Alert | null>;
  abstract findAll(): Promise<Alert[]>;
  abstract findCandidatesForPublishedVehicle(params: {
    make_slug: string;
    model_slug: string;
    exclude_profile_id: string;
  }): Promise<Alert[]>;
  abstract update(alert: Alert): Promise<void>;
  abstract delete(id: string): Promise<void>;
}
