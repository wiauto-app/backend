export interface CreateTicketDto {
  profile_id: string;
  category_id: string;
  title: string;
  description: string;
  file_url?: string | null;
}
