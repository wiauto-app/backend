export interface AssistantIntent {
  make?: string;
  model?: string;
  vehicle_type?: string;
  /** Ciudad, provincia o zona tal como la escribe el usuario. */
  location?: string;
  lat?: number;
  lng?: number;
}
