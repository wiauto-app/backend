export interface PrimitiveNotification {
  id: string;
  profile_id: string;
  category: string;
  title: string;
  body: string;
  data: Record<string, unknown> | null;
  read_at: Date | null;
  created_at: Date;
}
