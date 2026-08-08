import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";

import { PaginatedResult } from "@/src/contexts/shared/types/paginated-result.vo";
import { TicketEntity } from "@/src/contexts/support/entities/ticket.entity";

import { Chat } from "../types/chat";
import { ChatListItem, ChatTicketSummary } from "../types/chat-list-item";
import { ChatParticipantLookupPort } from "../ports/chat-participant-lookup.port";
import { ChatParticipantSummary } from "../types/chat-participant-summary";
import { TypeOrmChatParticipantStateRepository } from "@/src/contexts/chat/repositories/typeorm.chat-participant-state-repository";
import { TypeOrmChatMessageRepository } from "@/src/contexts/chat/repositories/typeorm.chat-message-repository";
import { ChatListItemMapper } from "./chat-list-item.mapper";
import { ChatMessageReadModelService } from "./chat-message-read-model.service";

@Injectable()
export class ChatReadModelService {
  constructor(
    private readonly chat_participant_lookup_port: ChatParticipantLookupPort,
    private readonly chat_list_item_mapper: ChatListItemMapper,
    private readonly chat_participant_state_repository: TypeOrmChatParticipantStateRepository,
    private readonly chat_message_repository: TypeOrmChatMessageRepository,
    private readonly chat_message_read_model_service: ChatMessageReadModelService,
    @InjectRepository(TicketEntity)
    private readonly ticket_repository: Repository<TicketEntity>,
  ) {}

  async toChatListItem(
    chat: Chat,
    requesting_user_id: string,
  ): Promise<ChatListItem> {
    const participants_map = await this.getParticipantsMap(chat.participants);
    const base = this.chat_list_item_mapper.mapOne(
      chat,
      participants_map,
      requesting_user_id,
    );
    const [states_map, last_messages_map, tickets_map] = await Promise.all([
      this.chat_participant_state_repository.findByChatIdsForUser(
        [chat.id],
        requesting_user_id,
      ),
      this.chat_message_repository.findLatestByChatIds([chat.id]),
      this.getTicketsMap(
        chat.ticket_id ? [chat.ticket_id] : [],
      ),
    ]);
    return this.applyEnrichment(base, states_map, last_messages_map, tickets_map);
  }

  async toChatList(
    chats: PaginatedResult<Chat>,
    requesting_user_id: string,
  ): Promise<PaginatedResult<ChatListItem>> {
    const unique_participant_ids = [
      ...new Set(chats.data.flatMap((chat) => chat.participants)),
    ];
    const participants_map = await this.getParticipantsMap(
      unique_participant_ids,
    );
    const base_items = chats.data.map((chat) =>
      this.chat_list_item_mapper.mapOne(
        chat,
        participants_map,
        requesting_user_id,
      ),
    );

    const chat_ids = chats.data.map((chat) => chat.id);
    const ticket_ids = chats.data
      .map((chat) => chat.ticket_id)
      .filter((id): id is string => Boolean(id));

    const [states_map, last_messages_map, tickets_map] = await Promise.all([
      this.chat_participant_state_repository.findByChatIdsForUser(
        chat_ids,
        requesting_user_id,
      ),
      this.chat_message_repository.findLatestByChatIds(chat_ids),
      this.getTicketsMap(ticket_ids),
    ]);

    const enriched = base_items.map((item) =>
      this.applyEnrichment(item, states_map, last_messages_map, tickets_map),
    );
    return new PaginatedResult(enriched, chats.total, chats.page, chats.limit);
  }

  private applyEnrichment(
    item: ChatListItem,
    states_map: Map<
      string,
      import("../types/chatParticipantState").ChatParticipantState
    >,
    last_messages_map: Map<
      string,
      import("../types/chat-last-message-snapshot").ChatLastMessageSnapshot
    >,
    tickets_map: Map<string, ChatTicketSummary>,
  ): ChatListItem {
    const state = states_map.get(item.id);
    const last_message = last_messages_map.get(item.id);
    const ticket = item.ticket_id
      ? (tickets_map.get(item.ticket_id) ?? null)
      : null;
    return {
      ...item,
      ticket,
      unread_count: state?.unread_count ?? 0,
      last_message_preview: last_message
        ? this.chat_message_read_model_service.buildPreview(
            last_message.type,
            last_message.content,
            null,
          )
        : null,
      last_message_at: last_message?.created_at ?? null,
      last_message_type: last_message?.type ?? null,
    };
  }

  private async getTicketsMap(
    ticket_ids: string[],
  ): Promise<Map<string, ChatTicketSummary>> {
    if (ticket_ids.length === 0) {
      return new Map();
    }

    const unique_ids = [...new Set(ticket_ids)];
    const rows = await this.ticket_repository.find({
      where: { id: In(unique_ids) },
      select: ["id", "title", "status"],
    });

    return new Map(
      rows.map((row) => [
        row.id,
        { id: row.id, title: row.title, status: row.status },
      ]),
    );
  }

  private async getParticipantsMap(
    participant_ids: string[],
  ): Promise<Map<string, ChatParticipantSummary>> {
    const participants =
      await this.chat_participant_lookup_port.findByIds(participant_ids);
    return new Map(
      participants.map((participant) => [participant.id, participant]),
    );
  }
}
