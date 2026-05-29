import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { PaginatedResult } from "@/src/contexts/shared/domain/value-objects/paginated-result.vo";
import { FileStoragePort } from "@/src/contexts/shared/file/domain/ports/file-storage.port";

import { CHAT_MESSAGE_TYPE, ChatMessage } from "../../domain/entities/chatMessage";
import { ChatMessageListItem } from "../../domain/read-models/chat-message-list-item";

export const CHAT_ATTACHMENTS_BUCKET = "chat-attachments";

@Injectable()
export class ChatMessageReadModelService {
  constructor(private readonly file_storage_port: FileStoragePort) {}

  async toListItem(message: ChatMessage): Promise<ChatMessageListItem> {
    const media_url = await this.resolveMediaUrl(message);
    return {
      id: message.id,
      chat_id: message.chat.id,
      sender_id: message.sender_id,
      content: message.content,
      type: message.type,
      status: message.status,
      metadata: message.metadata,
      edited_at: message.edited_at,
      created_at: message.created_at,
      updated_at: message.updated_at,
      deleted_at: message.deleted_at,
      media_url,
    };
  }

  async toList(messages: PaginatedResult<ChatMessage>): Promise<PaginatedResult<ChatMessageListItem>> {
    const data = await Promise.all(messages.data.map((message) => this.toListItem(message)));
    return new PaginatedResult(data, messages.total, messages.page, messages.limit);
  }

  buildPreview(type: ChatMessage["type"], content: string, metadata: ChatMessage["metadata"]): string {
    if (type === CHAT_MESSAGE_TYPE.TEXT) {
      return content.length > 80 ? `${content.slice(0, 80)}…` : content;
    }
    if (metadata?.caption?.trim()) {
      return metadata.caption;
    }
    if (type === CHAT_MESSAGE_TYPE.IMAGE) return "Imagen";
    if (type === CHAT_MESSAGE_TYPE.AUDIO) return "Audio";
    if (type === CHAT_MESSAGE_TYPE.FILE) {
      return metadata?.file_name ?? "Archivo";
    }
    return "Mensaje";
  }

  private async resolveMediaUrl(message: ChatMessage): Promise<string | null> {
    if (message.type === CHAT_MESSAGE_TYPE.TEXT) return null;

    const { bucket_name, file_key } = this.parseStoragePath(message.content);
    const result = await this.file_storage_port.generateReadSignedUrl(bucket_name, file_key);
    return result.signed_url;
  }

  private parseStoragePath(content: string): { bucket_name: string; file_key: string } {
    const slash_index = content.indexOf("/");
    if (slash_index > 0) {
      return {
        bucket_name: content.slice(0, slash_index),
        file_key: content.slice(slash_index + 1),
      };
    }
    return {
      bucket_name: CHAT_ATTACHMENTS_BUCKET,
      file_key: content,
    };
  }
}
