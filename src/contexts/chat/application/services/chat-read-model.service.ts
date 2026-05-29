import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { PaginatedResult } from "@/src/contexts/shared/domain/value-objects/paginated-result.vo";
import { Chat } from "../../domain/entities/chat";
import { ChatListItem } from "../../domain/read-models/chat-list-item";
import { ChatParticipantLookupPort } from "../ports/chat-participant-lookup.port";
import { ChatListItemMapper } from "../mappers/chat-list-item.mapper";
import { ChatParticipantSummary } from "../../domain/read-models/chat-participant-summary";
import { ChatParticipantStateRepository } from "../../domain/repositories/chat-participant-state.repository";
import { ChatMessageRepository } from "../../domain/repositories/chat-message.repository";
import { ChatMessageReadModelService } from "./chat-message-read-model.service";

@Injectable()
export class ChatReadModelService {
  constructor(
    private readonly chat_participant_lookup_port: ChatParticipantLookupPort,
    private readonly chat_list_item_mapper: ChatListItemMapper,
    private readonly chat_participant_state_repository: ChatParticipantStateRepository,
    private readonly chat_message_repository: ChatMessageRepository,
    private readonly chat_message_read_model_service: ChatMessageReadModelService,
  ) {}

  async toChatListItem(chat: Chat, requesting_user_id: string): Promise<ChatListItem> {
    const participants_map = await this.getParticipantsMap(chat.participants);
    const base = this.chat_list_item_mapper.mapOne(chat, participants_map, requesting_user_id);
    const [states_map, last_messages_map] = await Promise.all([
      this.chat_participant_state_repository.findByChatIdsForUser([chat.id], requesting_user_id),
      this.chat_message_repository.findLatestByChatIds([chat.id]),
    ]);
    return this.applyEnrichment(base, states_map, last_messages_map);
  }

  async toChatList(
    chats: PaginatedResult<Chat>,
    requesting_user_id: string,
  ): Promise<PaginatedResult<ChatListItem>> {
    const unique_participant_ids = [...new Set(chats.data.flatMap((chat) => chat.participants))];
    const participants_map = await this.getParticipantsMap(unique_participant_ids);
    const base_items = chats.data.map((chat) =>
      this.chat_list_item_mapper.mapOne(chat, participants_map, requesting_user_id),
    );

    const chat_ids = chats.data.map((chat) => chat.id);
    const [states_map, last_messages_map] = await Promise.all([
      this.chat_participant_state_repository.findByChatIdsForUser(chat_ids, requesting_user_id),
      this.chat_message_repository.findLatestByChatIds(chat_ids),
    ]);

    const enriched = base_items.map((item) =>
      this.applyEnrichment(item, states_map, last_messages_map),
    );
    return new PaginatedResult(enriched, chats.total, chats.page, chats.limit);
  }

  private applyEnrichment(
    item: ChatListItem,
    states_map: Map<string, import("../../domain/entities/chatParticipantState").ChatParticipantState>,
    last_messages_map: Map<
      string,
      import("../../domain/repositories/chat-message.repository").ChatLastMessageSnapshot
    >,
  ): ChatListItem {
    const state = states_map.get(item.id);
    const last_message = last_messages_map.get(item.id);
    return {
      ...item,
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

  private async getParticipantsMap(
    participant_ids: string[],
  ): Promise<Map<string, ChatParticipantSummary>> {
    const participants = await this.chat_participant_lookup_port.findByIds(participant_ids);
    return new Map(participants.map((participant) => [participant.id, participant]));
  }
}
