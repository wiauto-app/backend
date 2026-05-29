import { PaginationDto } from "@/src/contexts/shared/application/dtos/pagination.dto";

export class FindChatsByParticipantDto extends PaginationDto {
  participants_ids: string[];
  requesting_user_id: string;
}
