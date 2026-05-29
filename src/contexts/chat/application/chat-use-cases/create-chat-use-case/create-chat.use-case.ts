import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";

import { Chat } from "../../../domain/entities/chat";
import { ChatRepository } from "../../../domain/repositories/chat.repository";
import { CreateChatDto } from "./create-chat.dto";
import { ChatAlreadyExistsException } from "../../../domain/exceptions/chat-already-exist.exception";

@Injectable()
export class CreateChatUseCase {
  constructor(private readonly chat_repository: ChatRepository) { }

  async execute(create_chat_dto: CreateChatDto): Promise<Chat> {

    const chat_exists = await this.chat_repository.chatExists(create_chat_dto.participants, create_chat_dto.vehicle_id);
    if (chat_exists) {
      throw new ChatAlreadyExistsException();
    }

    const chat = Chat.create({
      participants: create_chat_dto.participants,
      chat_type: create_chat_dto.chat_type,
      vehicle_id: create_chat_dto.vehicle_id,
    });
    await this.chat_repository.save(chat);
    return chat;
  }
}
