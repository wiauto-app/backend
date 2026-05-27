import { uuidv4 } from "@/src/contexts/shared/uuid-generator/uuid-generator";
import { Chat } from "./chat";


export const CHAT_MESSAGE_TYPE = {
  TEXT: "text",
  AUDIO: "audio",
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


  static create(payload: {
    chat: Chat;
    sender_id: string;
    content: string;
    type: ChatMessageType;
  }): ChatMessage {
    const chatMessage = new ChatMessage()
    chatMessage.id = uuidv4();
    chatMessage.chat = payload.chat;
    chatMessage.sender_id = payload.sender_id;
    chatMessage.content = payload.content;
    chatMessage.type = payload.type;
    chatMessage.status = CHAT_MESSAGE_STATUS.PENDING;
    chatMessage.created_at = new Date();
    chatMessage.updated_at = new Date();
    chatMessage.deleted_at = null;
    return chatMessage;
  }
  
  update(payload: {
    content?: string;
    type?: ChatMessageType;
    status?: ChatMessageStatus;
  }): ChatMessage {

    const chatMessage = new ChatMessage();

    chatMessage.id = this.id;
    chatMessage.chat = this.chat;
    chatMessage.sender_id = this.sender_id;
    chatMessage.created_at = this.created_at;
    chatMessage.deleted_at = this.deleted_at;

    chatMessage.content =
      payload.content ?? this.content;

    chatMessage.type =
      payload.type ?? this.type;

    chatMessage.status =
      payload.status ?? this.status;

    chatMessage.updated_at = new Date();

    return chatMessage;
  }
}