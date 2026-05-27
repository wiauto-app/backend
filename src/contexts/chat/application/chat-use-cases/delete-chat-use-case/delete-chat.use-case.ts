import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";

import { ChatRepository } from "../../../domain/repositories/chat.repository";
import { DeleteChatDto } from "./delete-chat.dto";

@Injectable()
export class DeleteChatUseCase {
  constructor(private readonly chat_repository: ChatRepository) {}

  async execute(delete_chat_dto: DeleteChatDto): Promise<void> {
    await this.chat_repository.delete(delete_chat_dto.id);
  }
}
