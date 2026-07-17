import { ChatParticipantSummary } from "../types/chat-participant-summary";

export abstract class ChatParticipantLookupPort {
  abstract findByIds(ids: string[]): Promise<ChatParticipantSummary[]>;
}

