export interface FindChatsByParticipantDto {
  participants_ids: string[];
  requesting_user_id: string;
  page: number;
  limit: number;
  order_direction?: "ASC" | "DESC";
  query?: string;
  order_by?: string;
  search?: string;
}
