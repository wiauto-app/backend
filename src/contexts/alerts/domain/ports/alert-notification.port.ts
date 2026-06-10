export interface AlertMatchNotificationPayload {
  alert_id: string;
  alert_name: string;
  alert_email: string;
  vehicle_id: string;
  vehicle_title: string;
  vehicle_price: number;
  vehicle_image_url: string | null;
  vehicle_year: number;
  vehicle_mileage: number;
  vehicle_fuel_label: string;
  vehicle_transmission_label: string;
  vehicle_location_label: string;
}

export abstract class AlertNotificationDispatcher {
  abstract notifyMatch(
    payload: AlertMatchNotificationPayload,
  ): Promise<void>;
}
