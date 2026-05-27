import { ForbiddenException, Injectable } from "@nestjs/common";

import { Chat } from "../../domain/entities/chat";

@Injectable()
export class ChatAccessService {
  assertChatParticipant(chat: Chat, user_id: string): void {
    if (chat.participants.includes(user_id)) return;
    throw new ForbiddenException("No tienes acceso a este chat.");
  }
}

