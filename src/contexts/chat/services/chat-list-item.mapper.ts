import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { Chat } from "../types/chat";
import { ChatListItem } from "../types/chat-list-item";
import { ChatParticipantSummary } from "../types/chat-participant-summary";

@Injectable()
export class ChatListItemMapper {
  mapOne(
    chat: Chat,
    participants_map: Map<string, ChatParticipantSummary>,
    requesting_user_id: string,
  ): ChatListItem {
    const other_participants = chat.participants
      .filter((participant_id) => participant_id !== requesting_user_id)
      .map((participant_id) => participants_map.get(participant_id))
      .filter((participant): participant is ChatParticipantSummary => Boolean(participant));

    return {
      id: chat.id,
      chat_type: chat.chat_type,
      vehicle_id: chat.vehicle_id,
      created_at: chat.created_at,
      updated_at: chat.updated_at,
      other_participants,
      unread_count: 0,
      last_message_preview: null,
      last_message_at: null,
      last_message_type: null,
    };
  }
}

