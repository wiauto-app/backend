import { PaginationFilter } from "@/src/contexts/shared/domain/filters/pagination.filter";
import { Chat } from "../entities/chat";
import { PaginatedResult } from "@/src/contexts/shared/domain/value-objects/paginated-result.vo";


export abstract class ChatRepository {
  abstract save(chat: Chat): Promise<void>;
  abstract findOne(id: string): Promise<Chat | null>;
  abstract findByParticipantId(participant_id: string,pagination: PaginationFilter): Promise<PaginatedResult<Chat>>;
  abstract delete(id: string): Promise<void>;
}