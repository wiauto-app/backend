export class RecordVehicleViewDto {
  vehicle_id: string;
  user_id: string | null;
  ip_hash: string | null;
  user_agent: string | null;
  referer: string | null;
  metadata: Record<string, unknown>;
}
