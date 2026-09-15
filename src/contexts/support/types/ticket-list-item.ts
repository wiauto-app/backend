import { TicketStatus } from "./ticket";

export interface TicketCategoryRef {
  id: string;
  name: string;
  slug: string;
  created_at: Date;
  updated_at: Date;
}

export interface TicketListItem {
  id: string;
  title: string;
  description: string;
  file_url: string | null;
  status: TicketStatus;
  profile_id: string | null;
  profile_label: string;
  guest_name: string | null;
  guest_email: string | null;
  chat_id: string | null;
  created_at: Date;
  updated_at: Date;
  category: TicketCategoryRef;
}

export type TicketDetail = TicketListItem;
