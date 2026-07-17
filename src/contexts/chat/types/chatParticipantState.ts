export class ChatParticipantState {
  chat_id: string;
  user_id: string;
  last_read_message_id: string | null;
  last_read_at: Date | null;
  unread_count: number;

  static create(payload: {
    chat_id: string;
    user_id: string;
    last_read_message_id?: string | null;
    last_read_at?: Date | null;
    unread_count?: number;
  }): ChatParticipantState {
    const state = new ChatParticipantState();
    state.chat_id = payload.chat_id;
    state.user_id = payload.user_id;
    state.last_read_message_id = payload.last_read_message_id ?? null;
    state.last_read_at = payload.last_read_at ?? null;
    state.unread_count = payload.unread_count ?? 0;
    return state;
  }
}
