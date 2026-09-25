export const CHAT_AI_ASSISTANT_AUTHOR = "ai_assistant";

export type ChatMessageAuthor = typeof CHAT_AI_ASSISTANT_AUTHOR;

export interface ChatMessageMetadata {
  author?: ChatMessageAuthor;
  file_name?: string;
  mime_type?: string;
  file_size_bytes?: number;
  duration_seconds?: number;
  caption?: string;
  width?: number;
  height?: number;
}
