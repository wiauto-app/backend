import { TicketStatus } from "../../../domain/entities/ticket";

export interface UpdateTicketDto {
  ticket_id: string;
  profile_id: string;
  category_id?: string;
  title?: string;
  description?: string;
  file_url?: string | null;
  status?: TicketStatus;
}
