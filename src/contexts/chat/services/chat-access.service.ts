import { ForbiddenException, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { User } from "@/src/contexts/users/entities/user.entity";

import { CHAT_TYPE, Chat } from "../types/chat";

@Injectable()
export class ChatAccessService {
  constructor(
    @InjectRepository(User)
    private readonly user_repository: Repository<User>,
  ) {}

  async assertChatAccess(chat: Chat, user_id: string): Promise<void> {
    if (chat.participants.includes(user_id)) return;

    if (this.isSupportChat(chat) && (await this.isAdmin(user_id))) {
      return;
    }

    throw new ForbiddenException("No tienes acceso a este chat.");
  }

  async isAdmin(user_id: string): Promise<boolean> {
    const user = await this.user_repository.findOne({
      where: { id: user_id },
      select: ["id", "is_admin"],
    });
    return user?.is_admin === true;
  }

  isSupportChat(chat: Chat): boolean {
    return chat.ticket_id != null || chat.chat_type === CHAT_TYPE.SUPPORT;
  }
}
