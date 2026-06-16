import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import {
  formatLocationLabel,
  formatTransmissionLabel,
  humanizeSlug,
} from "@/src/contexts/shared/mail/mail-template.format";
import { PublishedVehicleSnapshotPort } from "@/src/contexts/vehicles/application/ports/published-vehicle-snapshot.port";

import { AlertRepository } from "../../domain/alert.repository";
import { AlertNotificationDispatcher } from "../../domain/ports/alert-notification.port";
import { vehicle_matches_alert_filters } from "./alert-vehicle-matcher";
import { MatchVehicleAlertsDto } from "./match-vehicle-alerts.dto";

@Injectable()
export class MatchVehicleAlertsUseCase {
  constructor(
    private readonly published_vehicle_snapshot_port: PublishedVehicleSnapshotPort,
    private readonly alert_repository: AlertRepository,
    private readonly alert_notification_dispatcher: AlertNotificationDispatcher,
  ) {}

  async execute(dto: MatchVehicleAlertsDto): Promise<void> {
    const snapshot = await this.published_vehicle_snapshot_port.buildForVehicleId(
      dto.vehicle_id,
    );
    if (!snapshot) {
      return;
    }

    const candidates = await this.alert_repository.findCandidatesForPublishedVehicle({
      make_slug: snapshot.make_slug,
      model_slug: snapshot.model_slug,
      exclude_profile_id: snapshot.profile_id,
    });

    const matched_alerts = candidates.filter((alert) =>
      vehicle_matches_alert_filters(snapshot, alert.toPrimitives().filters),
    );
    for (const alert of matched_alerts) {
      const primitive = alert.toPrimitives();
      await this.alert_notification_dispatcher.notifyMatch({
        alert_id: primitive.id,
        alert_name: primitive.name,
        alert_email: primitive.email,
        vehicle_id: snapshot.vehicle_id,
        vehicle_title: snapshot.vehicle_label,
        vehicle_price: snapshot.price,
        vehicle_image_url: snapshot.cover_image_url,
        vehicle_year: snapshot.year,
        vehicle_mileage: snapshot.mileage,
        vehicle_fuel_label: humanizeSlug(snapshot.fuel_type_slug),
        vehicle_transmission_label: formatTransmissionLabel(snapshot.transmission_type),
        vehicle_location_label: formatLocationLabel(
          snapshot.municipalities_slugs,
          snapshot.province_slugs,
        ),
      });

      await this.alert_repository.update(
        alert.update({ last_sent_at: new Date() }),
      );
    }
  }
}
