import { ChatParticipantSummary } from "../../domain/read-models/chat-participant-summary";

export abstract class ChatParticipantLookupPort {
  abstract findByIds(ids: string[]): Promise<ChatParticipantSummary[]>;
}

