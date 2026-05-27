import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";

import { Chat } from "../../../domain/entities/chat";
import { ChatNotFoundException } from "../../../domain/exceptions/chat-not-found.exception";
import { ChatRepository } from "../../../domain/repositories/chat.repository";
import { FindChatDto } from "./find-chat.dto";

@Injectable()
export class FindChatUseCase {
  constructor(private readonly chat_repository: ChatRepository) {}

  async execute(find_chat_dto: FindChatDto): Promise<Chat> {
    const chat = await this.chat_repository.findOne(find_chat_dto.id);
    if (!chat) {
      throw new ChatNotFoundException(find_chat_dto.id);
    }
    return chat;
  }
}
