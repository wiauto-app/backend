import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";

import { AlertProcessingEnqueueService } from "@/src/contexts/alerts/infrastructure/queues/alert-processing-enqueue.service";
import { ALERT_EVENT_TYPE } from "@/src/contexts/alerts/domain/enums/alert-event-type.enum";
import { VehicleRepository } from "@/src/contexts/vehicles/domain/repositories/vehicle.repository";

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
    private readonly vehicle_repository: VehicleRepository,
    private readonly alert_processing_enqueue_service: AlertProcessingEnqueueService,
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

    await this.enqueue_message_alerts(chat, create_chat_message_dto.sender_id);

    return chat_message;
  }

  private async enqueue_message_alerts(
    chat: { id: string; participants: string[]; vehicle_id: string | null },
    sender_id: string,
  ): Promise<void> {
    if (!chat.vehicle_id) {
      return;
    }

    const vehicle = await this.vehicle_repository.findOne(chat.vehicle_id);
    if (!vehicle?.profile_id) {
      return;
    }

    const owner_profile_id = vehicle.profile_id;
    const sender_is_owner = sender_id === owner_profile_id;

    for (const participant_id of chat.participants) {
      if (participant_id === sender_id) {
        continue;
      }

      const event_type = sender_is_owner
        ? ALERT_EVENT_TYPE.SELLER_REPLY
        : participant_id === owner_profile_id
          ? ALERT_EVENT_TYPE.NEW_MESSAGE
          : null;

      if (!event_type) {
        continue;
      }

      await this.alert_processing_enqueue_service.enqueue_vehicle_event({
        vehicle_id: chat.vehicle_id,
        event_type,
        profile_id: participant_id,
        metadata: {
          chat_id: chat.id,
        },
      });
    }
  }
}
