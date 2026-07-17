import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { PaginationFilter } from "@/src/contexts/shared/types/pagination.filter";
import { PaginatedResult } from "@/src/contexts/shared/types/paginated-result.vo";

import { AlertProcessingEnqueueService } from "@/src/contexts/alerts/queues/alert-processing-enqueue.service";
import { ALERT_EVENT_TYPE } from "@/src/contexts/alerts/types/alert-event-type.enum";
import { TypeOrmVehicleRepository } from "@/src/contexts/vehicles/repositories/typeorm.vehicle-repository";

import { ChatNotFoundException } from "../exceptions/chat-not-found.exception";
import { ChatMessageNotFoundException } from "../exceptions/chat-message-not-found.exception";
import {
  CHAT_MESSAGE_TYPE,
  ChatMessage,
} from "../types/chatMessage";
import { TypeOrmChatMessageRepository } from "@/src/contexts/chat/repositories/typeorm.chat-message-repository";
import { TypeOrmChatParticipantStateRepository } from "@/src/contexts/chat/repositories/typeorm.chat-participant-state-repository";
import { TypeOrmChatRepository } from "@/src/contexts/chat/repositories/typeorm.chat-repository";
import { CreateChatMessageDto } from "../dto/create-chat-message.dto";
import { DeleteChatMessageDto } from "../dto/delete-chat-message.dto";
import { FindChatMessageDto } from "../dto/find-chat-message.dto";
import { FindMessagesByChatDto } from "../dto/find-messages-by-chat.dto";
import { MarkChatMessagesReadDto } from "../dto/mark-chat-messages-read.dto";
import { UpdateChatMessageDto } from "../dto/update-chat-message.dto";

@Injectable()
export class ChatMessageService {
  constructor(
    private readonly chat_message_repository: TypeOrmChatMessageRepository,
    private readonly chat_repository: TypeOrmChatRepository,
    private readonly chat_participant_state_repository: TypeOrmChatParticipantStateRepository,
    private readonly vehicle_repository: TypeOrmVehicleRepository,
    private readonly alert_processing_enqueue_service: AlertProcessingEnqueueService,
  ) {}

  async create(
    create_chat_message_dto: CreateChatMessageDto,
  ): Promise<ChatMessage> {
    const chat = await this.chat_repository.findOne(
      create_chat_message_dto.chat_id,
    );
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

    await this.enqueueMessageAlerts(chat, create_chat_message_dto.sender_id);

    return chat_message;
  }

  async findOne(
    find_chat_message_dto: FindChatMessageDto,
  ): Promise<ChatMessage> {
    const chat_message = await this.chat_message_repository.findOne(
      find_chat_message_dto.id,
    );
    if (!chat_message) {
      throw new ChatMessageNotFoundException(find_chat_message_dto.id);
    }
    return chat_message;
  }

  async findByChat(
    find_messages_by_chat_dto: FindMessagesByChatDto,
  ): Promise<PaginatedResult<ChatMessage>> {
    const pagination_filter = new PaginationFilter(
      find_messages_by_chat_dto.page,
      find_messages_by_chat_dto.limit,
      find_messages_by_chat_dto.order_direction ?? "ASC",
      find_messages_by_chat_dto.query,
      find_messages_by_chat_dto.order_by,
      find_messages_by_chat_dto.search,
    );

    return this.chat_message_repository.findByChatId(
      find_messages_by_chat_dto.chat_id,
      pagination_filter,
    );
  }

  async markAsRead(dto: MarkChatMessagesReadDto): Promise<{
    updated_messages: ChatMessage[];
    unread_count: number;
  }> {
    const chat = await this.chat_repository.findOne(dto.chat_id);
    if (!chat) {
      throw new ChatNotFoundException(dto.chat_id);
    }

    const updated_messages =
      await this.chat_message_repository.markMessagesAsReadForRecipient(
        dto.chat_id,
        dto.user_id,
        dto.last_message_id,
      );

    await this.chat_participant_state_repository.resetUnread(
      dto.chat_id,
      dto.user_id,
      dto.last_message_id ?? updated_messages.at(-1)?.id ?? null,
    );

    const state = await this.chat_participant_state_repository.findOne(
      dto.chat_id,
      dto.user_id,
    );

    return {
      updated_messages,
      unread_count: state?.unread_count ?? 0,
    };
  }

  async update(
    update_chat_message_dto: UpdateChatMessageDto,
  ): Promise<ChatMessage> {
    const existing = await this.chat_message_repository.findOne(
      update_chat_message_dto.id,
    );
    if (!existing) {
      throw new ChatMessageNotFoundException(update_chat_message_dto.id);
    }

    const content_changed =
      update_chat_message_dto.content !== undefined &&
      update_chat_message_dto.content !== existing.content;

    const updated_chat_message = existing.update({
      content: update_chat_message_dto.content,
      type: update_chat_message_dto.type,
      status: update_chat_message_dto.status,
      metadata: update_chat_message_dto.metadata,
      edited_at:
        content_changed && existing.type === CHAT_MESSAGE_TYPE.TEXT
          ? new Date()
          : existing.edited_at,
    });

    await this.chat_message_repository.save(updated_chat_message);
    return updated_chat_message;
  }

  async delete(delete_chat_message_dto: DeleteChatMessageDto): Promise<void> {
    await this.chat_message_repository.delete(delete_chat_message_dto.id);
  }

  private async enqueueMessageAlerts(
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
