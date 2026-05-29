import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";

import { ChatNotFoundException } from "../../../domain/exceptions/chat-not-found.exception";
import { ChatMessage } from "../../../domain/entities/chatMessage";
import { ChatMessageRepository } from "../../../domain/repositories/chat-message.repository";
import { ChatParticipantStateRepository } from "../../../domain/repositories/chat-participant-state.repository";
import { ChatRepository } from "../../../domain/repositories/chat.repository";
import { CreateChatMessageDto } from "./create-chat-message.dto";

@Injectable()
export class CreateChatMessageUseCase {
  constructor(
    private readonly chat_message_repository: ChatMessageRepository,
    private readonly chat_repository: ChatRepository,
    private readonly chat_participant_state_repository: ChatParticipantStateRepository,
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
      metadata: create_chat_message_dto.metadata,
    });

    await this.chat_message_repository.save(chat_message);
    await this.chat_participant_state_repository.incrementUnreadForOthers(
      chat.id,
      create_chat_message_dto.sender_id,
    );

    return chat_message;
  }
}
