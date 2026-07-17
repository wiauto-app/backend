import { uuidv4 } from "@/src/contexts/shared/uuid-generator/uuid-generator";
import { Chat } from "./chat";
import { ChatMessageMetadata } from "./chatMessageMetadata";

export const CHAT_MESSAGE_TYPE = {
  TEXT: "text",
  IMAGE: "image",
  AUDIO: "audio",
  FILE: "file",
} as const;

export type ChatMessageType = (typeof CHAT_MESSAGE_TYPE)[keyof typeof CHAT_MESSAGE_TYPE];

export const CHAT_MESSAGE_STATUS = {
  PENDING: "pending",
  SENT: "sent",
  DELIVERED: "delivered",
  READ: "read",
} as const;

export type ChatMessageStatus = (typeof CHAT_MESSAGE_STATUS)[keyof typeof CHAT_MESSAGE_STATUS];

export class ChatMessage {
  id: string;
  status: ChatMessageStatus;
  chat: Chat;
  sender_id: string;
  content: string;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
  type: ChatMessageType;
  metadata: ChatMessageMetadata | null;
  edited_at: Date | null;

  static create(payload: {
    chat: Chat;
    sender_id: string;
    content: string;
    type: ChatMessageType;
    metadata?: ChatMessageMetadata | null;
  }): ChatMessage {
    const chat_message = new ChatMessage();
    chat_message.id = uuidv4();
    chat_message.chat = payload.chat;
    chat_message.sender_id = payload.sender_id;
    chat_message.content = payload.content;
    chat_message.type = payload.type;
    chat_message.metadata = payload.metadata ?? null;
    chat_message.status = CHAT_MESSAGE_STATUS.SENT;
    chat_message.created_at = new Date();
    chat_message.updated_at = new Date();
    chat_message.deleted_at = null;
    chat_message.edited_at = null;
    return chat_message;
  }

  update(payload: {
    content?: string;
    type?: ChatMessageType;
    status?: ChatMessageStatus;
    metadata?: ChatMessageMetadata | null;
    edited_at?: Date | null;
  }): ChatMessage {
    const chat_message = new ChatMessage();

    chat_message.id = this.id;
    chat_message.chat = this.chat;
    chat_message.sender_id = this.sender_id;
    chat_message.created_at = this.created_at;
    chat_message.deleted_at = this.deleted_at;
    chat_message.metadata = payload.metadata ?? this.metadata;
    chat_message.edited_at = payload.edited_at ?? this.edited_at;

    chat_message.content = payload.content ?? this.content;
    chat_message.type = payload.type ?? this.type;
    chat_message.status = payload.status ?? this.status;
    chat_message.updated_at = new Date();

    return chat_message;
  }
}
