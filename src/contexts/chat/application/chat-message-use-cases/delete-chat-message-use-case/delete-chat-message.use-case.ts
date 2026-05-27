import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";

import { ChatMessageRepository } from "../../../domain/repositories/chat-message.repository";
import { DeleteChatMessageDto } from "./delete-chat-message.dto";

@Injectable()
export class DeleteChatMessageUseCase {
  constructor(private readonly chat_message_repository: ChatMessageRepository) {}

  async execute(delete_chat_message_dto: DeleteChatMessageDto): Promise<void> {
    await this.chat_message_repository.delete(delete_chat_message_dto.id);
  }
}
