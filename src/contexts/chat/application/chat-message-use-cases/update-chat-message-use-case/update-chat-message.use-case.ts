import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";

import { CHAT_MESSAGE_TYPE, ChatMessage } from "../../../domain/entities/chatMessage";
import { ChatMessageNotFoundException } from "../../../domain/exceptions/chat-message-not-found.exception";
import { ChatMessageRepository } from "../../../domain/repositories/chat-message.repository";
import { UpdateChatMessageDto } from "./update-chat-message.dto";

@Injectable()
export class UpdateChatMessageUseCase {
  constructor(private readonly chat_message_repository: ChatMessageRepository) {}

  async execute(update_chat_message_dto: UpdateChatMessageDto): Promise<ChatMessage> {
    const existing = await this.chat_message_repository.findOne(update_chat_message_dto.id);
    if (!existing) {
      throw new ChatMessageNotFoundException(update_chat_message_dto.id);
    }

    const content_changed =
      update_chat_message_dto.content !== undefined &&
      update_chat_message_dto.content !== existing.content;

    const updated_chat_message = existing.update({
      content: update_chat_message_dto.content,
      type: update_chat_message_dto.type,
      status: update_chat_message_dto.status,
      metadata: update_chat_message_dto.metadata,
      edited_at:
        content_changed && existing.type === CHAT_MESSAGE_TYPE.TEXT
          ? new Date()
          : existing.edited_at,
    });

    await this.chat_message_repository.save(updated_chat_message);
    return updated_chat_message;
  }
}
