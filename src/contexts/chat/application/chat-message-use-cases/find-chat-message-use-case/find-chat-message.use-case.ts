import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";

import { ChatMessage } from "../../../domain/entities/chatMessage";
import { ChatMessageNotFoundException } from "../../../domain/exceptions/chat-message-not-found.exception";
import { ChatMessageRepository } from "../../../domain/repositories/chat-message.repository";
import { FindChatMessageDto } from "./find-chat-message.dto";

@Injectable()
export class FindChatMessageUseCase {
  constructor(private readonly chat_message_repository: ChatMessageRepository) {}

  async execute(find_chat_message_dto: FindChatMessageDto): Promise<ChatMessage> {
    const chat_message = await this.chat_message_repository.findOne(find_chat_message_dto.id);
    if (!chat_message) {
      throw new ChatMessageNotFoundException(find_chat_message_dto.id);
    }
    return chat_message;
  }
}
