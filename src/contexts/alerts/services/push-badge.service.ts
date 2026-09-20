import { Injectable } from "@nestjs/common";

import { TypeOrmChatParticipantStateRepository } from "@/src/contexts/chat/repositories/typeorm.chat-participant-state-repository";

import { TypeOrmNotificationRepository } from "../repositories/typeorm.notification.repository";

/** Las notificaciones de chat ya cuentan en el total de chats; no se suman dos veces. */
const CHAT_NOTIFICATION_CATEGORIES = ["new_message", "seller_reply"] as const;

@Injectable()
export class PushBadgeService {
  constructor(
    private readonly chat_participant_state_repository: TypeOrmChatParticipantStateRepository,
    private readonly notification_repository: TypeOrmNotificationRepository,
  ) {}

  /** Badge iOS = mensajes de chat sin leer + notificaciones no leídas que no son de chat. */
  async compute_for_user(user_id: string): Promise<number> {
    const [chat_total, inbox_total] = await Promise.all([
      this.chat_participant_state_repository.getUnreadTotal(user_id),
      this.notification_repository.countUnreadExcludingCategories(
        user_id,
        CHAT_NOTIFICATION_CATEGORIES,
      ),
    ]);
    return chat_total + inbox_total;
  }
}
