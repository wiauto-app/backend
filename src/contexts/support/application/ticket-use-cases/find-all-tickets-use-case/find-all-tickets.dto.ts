import { TicketStatus } from "../../../domain/entities/ticket";

export interface FindAllTicketsDto {
  profile_id: string;
  status?: TicketStatus;
  category_id?: string;
  page?: number;
  limit?: number;
  query?: string;
  order_by?: string;
  order_direction?: "ASC" | "DESC";
}
