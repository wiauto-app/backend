import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";

import { ChatNotFoundException } from "../../../domain/exceptions/chat-not-found.exception";
import { ChatMessage } from "../../../domain/entities/chatMessage";
import { ChatMessageRepository } from "../../../domain/repositories/chat-message.repository";
import { ChatParticipantStateRepository } from "../../../domain/repositories/chat-participant-state.repository";
import { ChatRepository } from "../../../domain/repositories/chat.repository";
import { MarkChatMessagesReadDto } from "./mark-chat-messages-read.dto";

@Injectable()
export class MarkChatMessagesReadUseCase {
  constructor(
    private readonly chat_repository: ChatRepository,
    private readonly chat_message_repository: ChatMessageRepository,
    private readonly chat_participant_state_repository: ChatParticipantStateRepository,
  ) {}

  async execute(dto: MarkChatMessagesReadDto): Promise<{
    updated_messages: ChatMessage[];
    unread_count: number;
  }> {
    const chat = await this.chat_repository.findOne(dto.chat_id);
    if (!chat) {
      throw new ChatNotFoundException(dto.chat_id);
    }

    const updated_messages = await this.chat_message_repository.markMessagesAsReadForRecipient(
      dto.chat_id,
      dto.user_id,
      dto.last_message_id,
    );

    await this.chat_participant_state_repository.resetUnread(
      dto.chat_id,
      dto.user_id,
      dto.last_message_id ?? updated_messages.at(-1)?.id ?? null,
    );

    const state = await this.chat_participant_state_repository.findOne(dto.chat_id, dto.user_id);

    return {
      updated_messages,
      unread_count: state?.unread_count ?? 0,
    };
  }
}
