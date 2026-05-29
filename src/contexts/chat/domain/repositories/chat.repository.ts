import { PaginationFilter } from "@/src/contexts/shared/domain/filters/pagination.filter";
import { Chat } from "../entities/chat";
import { PaginatedResult } from "@/src/contexts/shared/domain/value-objects/paginated-result.vo";


export abstract class ChatRepository {
  abstract save(chat: Chat): Promise<void>;
  abstract findOne(id: string): Promise<Chat | null>;
  abstract findByParticipantsIds(participants_ids: string[], pagination?: PaginationFilter): Promise<PaginatedResult<Chat>>;
  abstract chatExists(participants_ids: string[], vehicle_id: string | null): Promise<boolean>;
  abstract delete(id: string): Promise<void>;
}