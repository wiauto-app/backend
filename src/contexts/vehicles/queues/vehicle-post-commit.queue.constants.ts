export const VEHICLE_POST_COMMIT_QUEUE = "vehicle-post-commit";

export const VEHICLE_POST_COMMIT_JOB_PROCESS_MEDIA =
  "process-media-and-side-effects";

export const VEHICLE_POST_COMMIT_RELOCATE_IMAGE_CONCURRENCY = 6;

export type VehiclePostCommitKind =
  | "create_publish"
  | "create_draft"
  | "update";

/** Imagen pendiente de post-commit (attach / cola). */
export interface VehiclePostCommitImageItem {
  image_id: string;
  upload_id: string;
  order: number;
}

export type VehiclePostCommitPendingImage = VehiclePostCommitImageItem;

export const vehiclePostCommitJobId = (vehicle_id: string): string =>
  `vehicle-post-commit-${vehicle_id}`;

export interface VehiclePostCommitJobData {
  vehicle_id: string;
  kind: VehiclePostCommitKind;
  publisher_profile_id?: string;
  expires_at?: string;
  now?: string;
  images: VehiclePostCommitPendingImage[];
  video_ids: string[];
  reindex: boolean;
  warm_cache: boolean;
}