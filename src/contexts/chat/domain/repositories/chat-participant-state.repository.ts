import { ChatParticipantState } from "../entities/chatParticipantState";

export abstract class ChatParticipantStateRepository {
  abstract findOne(chat_id: string, user_id: string): Promise<ChatParticipantState | null>;
  abstract save(state: ChatParticipantState): Promise<void>;
  abstract incrementUnreadForOthers(chat_id: string, sender_id: string): Promise<void>;
  abstract resetUnread(
    chat_id: string,
    user_id: string,
    last_read_message_id: string | null,
  ): Promise<void>;
  abstract getUnreadTotal(user_id: string): Promise<number>;
  abstract findByChatIdsForUser(
    chat_ids: string[],
    user_id: string,
  ): Promise<Map<string, ChatParticipantState>>;
}
