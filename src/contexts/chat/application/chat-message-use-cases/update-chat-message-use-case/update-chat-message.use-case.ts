import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";

import { ChatMessage } from "../../../domain/entities/chatMessage";
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

    const updated_chat_message = existing.update({
      content: update_chat_message_dto.content,
      type: update_chat_message_dto.type,
      status: update_chat_message_dto.status,
    });

    await this.chat_message_repository.save(updated_chat_message);
    return updated_chat_message;
  }
}
