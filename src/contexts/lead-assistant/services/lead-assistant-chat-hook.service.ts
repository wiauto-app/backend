import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { TypeOrmVehicleRepository } from "@/src/contexts/vehicles/repositories/typeorm.vehicle-repository";
import { CHAT_TYPE, Chat } from "@/src/contexts/chat/types/chat";
import { CHAT_MESSAGE_TYPE, ChatMessage } from "@/src/contexts/chat/types/chatMessage";
import { CHAT_AI_ASSISTANT_AUTHOR } from "@/src/contexts/chat/types/chatMessageMetadata";

import { LeadAssistantSettingsEntity } from "../entities/lead-assistant-settings.entity";
import { LeadAssistantReplyEnqueueService } from "../queues/lead-assistant-reply-enqueue.service";
import { ProfileEntity } from "../../profiles/entities/profile.entity";

@Injectable()
export class LeadAssistantChatHookService {
  constructor(
    @InjectRepository(LeadAssistantSettingsEntity)
    private readonly settings_repository: Repository<LeadAssistantSettingsEntity>,
    @InjectRepository(ProfileEntity)
    private readonly profile_repository: Repository<ProfileEntity>,
    private readonly vehicle_repository: TypeOrmVehicleRepository,
    private readonly lead_assistant_reply_enqueue_service: LeadAssistantReplyEnqueueService,
  ) { }

  async handleBuyerTextMessage(
    chat: Chat,
    message: ChatMessage,
    sender_id: string,
  ): Promise<void> {
    if (chat.ticket_id ?? chat.chat_type === CHAT_TYPE.SUPPORT) {
      return;
    }

    if (!chat.vehicle_id || message.type !== CHAT_MESSAGE_TYPE.TEXT) {
      return;
    }

    if (message.metadata?.author === CHAT_AI_ASSISTANT_AUTHOR) {
      return;
    }

    const vehicle = await this.vehicle_repository.findOne(chat.vehicle_id);
    if (!vehicle?.profile_id || vehicle.profile_id === sender_id) {
      return;
    }

    const profile = await this.profile_repository.findOne({
      where: { id: vehicle.profile_id },
      relations: ["user"],
    });
    if (!profile) {
      return;
    }

    const is_seller_admin = profile.user.is_admin;
    const settings = await this.settings_repository.findOne({
      where: { profile_id: vehicle.profile_id },
    });

    if (!is_seller_admin && !settings?.enabled) {
      return;
    }

    const delay_ms =
      Math.max(0, settings?.reply_delay_seconds ?? 30) * 1000;
    await this.lead_assistant_reply_enqueue_service.enqueue(
      {
        chat_id: chat.id,
        trigger_message_id: message.id,
        buyer_id: sender_id,
        seller_id: vehicle.profile_id,
        vehicle_id: chat.vehicle_id,
      },
      delay_ms,
    );
  }
}
