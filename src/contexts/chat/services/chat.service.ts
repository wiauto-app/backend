import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { PaginationFilter } from "@/src/contexts/shared/types/pagination.filter";
import { PaginatedResult } from "@/src/contexts/shared/types/paginated-result.vo";

import { Chat } from "../types/chat";
import { ChatAlreadyExistsException } from "../exceptions/chat-already-exist.exception";
import { ChatNotFoundException } from "../exceptions/chat-not-found.exception";
import { ChatListItem } from "../types/chat-list-item";
import { TypeOrmChatParticipantStateRepository } from "@/src/contexts/chat/repositories/typeorm.chat-participant-state-repository";
import { TypeOrmChatRepository } from "@/src/contexts/chat/repositories/typeorm.chat-repository";
import { CreateChatDto } from "../dto/create-chat.dto";
import { DeleteChatDto } from "../dto/delete-chat.dto";
import { FindChatDto } from "../dto/find-chat.dto";
import { FindChatsByParticipantDto } from "../dto/find-chats-by-participant.dto";
import { GetChatUnreadTotalDto } from "../dto/get-chat-unread-total.dto";
import { ChatReadModelService } from "./chat-read-model.service";

@Injectable()
export class ChatService {
  constructor(
    private readonly chat_repository: TypeOrmChatRepository,
    private readonly chat_participant_state_repository: TypeOrmChatParticipantStateRepository,
    private readonly chat_read_model_service: ChatReadModelService,
  ) {}

  async create(create_chat_dto: CreateChatDto): Promise<Chat> {
    const chat_exists = await this.chat_repository.chatExists(
      create_chat_dto.participants,
      create_chat_dto.vehicle_id,
    );
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

  async findOne(find_chat_dto: FindChatDto): Promise<Chat> {
    const chat = await this.chat_repository.findOne(find_chat_dto.id);
    if (!chat) {
      throw new ChatNotFoundException(find_chat_dto.id);
    }
    return chat;
  }

  async findByParticipant(
    find_chats_by_participant_dto: FindChatsByParticipantDto,
  ): Promise<PaginatedResult<ChatListItem>> {
    const pagination_filter = new PaginationFilter(
      find_chats_by_participant_dto.page,
      find_chats_by_participant_dto.limit,
      find_chats_by_participant_dto.order_direction,
      find_chats_by_participant_dto.query,
      find_chats_by_participant_dto.order_by,
      find_chats_by_participant_dto.search,
    );

    const chats = await this.chat_repository.findByParticipantsIds(
      find_chats_by_participant_dto.participants_ids,
      pagination_filter,
    );
    return this.chat_read_model_service.toChatList(
      chats,
      find_chats_by_participant_dto.requesting_user_id,
    );
  }

  async delete(delete_chat_dto: DeleteChatDto): Promise<void> {
    await this.chat_repository.delete(delete_chat_dto.id);
  }

  async getUnreadTotal(
    dto: GetChatUnreadTotalDto,
  ): Promise<{ total: number }> {
    const total =
      await this.chat_participant_state_repository.getUnreadTotal(dto.user_id);
    return { total };
  }
}
