export interface MarkChatMessagesReadDto {
  chat_id: string;
  user_id: string;
  last_message_id?: string;
}
