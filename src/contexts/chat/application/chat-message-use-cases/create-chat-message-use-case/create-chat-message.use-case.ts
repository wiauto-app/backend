import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";

import { ChatNotFoundException } from "../../../domain/exceptions/chat-not-found.exception";
import { ChatMessage } from "../../../domain/entities/chatMessage";
import { ChatMessageRepository } from "../../../domain/repositories/chat-message.repository";
import { ChatRepository } from "../../../domain/repositories/chat.repository";
import { CreateChatMessageDto } from "./create-chat-message.dto";

@Injectable()
export class CreateChatMessageUseCase {
  constructor(
    private readonly chat_message_repository: ChatMessageRepository,
    private readonly chat_repository: ChatRepository,
  ) {}

  async execute(create_chat_message_dto: CreateChatMessageDto): Promise<ChatMessage> {
    const chat = await this.chat_repository.findOne(create_chat_message_dto.chat_id);
    if (!chat) {
      throw new ChatNotFoundException(create_chat_message_dto.chat_id);
    }

    const chat_message = ChatMessage.create({
      chat,
      sender_id: create_chat_message_dto.sender_id,
      content: create_chat_message_dto.content,
      type: create_chat_message_dto.type,
    });

    await this.chat_message_repository.save(chat_message);
    return chat_message;
  }
}
