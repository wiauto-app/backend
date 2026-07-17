import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import type { ChatLastMessageSnapshot } from "../types/chat-last-message-snapshot";
import { InjectRepository } from "@nestjs/typeorm";
import { IsNull, Repository } from "typeorm";

import { PaginationFilter } from "@/src/contexts/shared/types/pagination.filter";
import { PaginatedResult } from "@/src/contexts/shared/types/paginated-result.vo";
import { Chat } from "../types/chat";
import {
  CHAT_MESSAGE_STATUS,
  ChatMessage,
} from "../types/chatMessage";
import { ChatMessageEntity } from "../entities/chat-message.orm.entity";

const CHAT_MESSAGE_SORT_KEYS = new Set([
  "id",
  "created_at",
  "updated_at",
  "status",
  "type",
]);

@Injectable()
export class TypeOrmChatMessageRepository {
  constructor(
    @InjectRepository(ChatMessageEntity)
    private readonly chat_message_repository: Repository<ChatMessageEntity>,
  ) {
  }

  async save(chat_message: ChatMessage): Promise<void> {
    const primitive = {
      id: chat_message.id,
      chat_id: chat_message.chat.id,
      sender_id: chat_message.sender_id,
      content: chat_message.content,
      type: chat_message.type,
      status: chat_message.status,
      metadata: chat_message.metadata,
      edited_at: chat_message.edited_at,
      created_at: chat_message.created_at,
      updated_at: chat_message.updated_at,
      deleted_at: chat_message.deleted_at,
    };

    const row = await this.chat_message_repository.preload(primitive);
    if (row) {
      await this.chat_message_repository.save(row);
      return;
    }

    await this.chat_message_repository.save(primitive);
  }

  async findOne(id: string): Promise<ChatMessage | null> {
    const row = await this.chat_message_repository.findOne({
      where: { id, deleted_at: IsNull() },
      relations: ["chat"],
    });
    if (!row) return null;
    return this.mapRowToChatMessage(row);
  }

  async findByChatId(
    chat_id: string,
    pagination: PaginationFilter,
  ): Promise<PaginatedResult<ChatMessage>> {
    const skip = (pagination.page - 1) * pagination.limit;
    const take = pagination.limit;
    const order_by =
      pagination.order_by && CHAT_MESSAGE_SORT_KEYS.has(pagination.order_by)
        ? pagination.order_by
        : "created_at";
    const order_direction = pagination.order_direction ?? "DESC";

    const qb = this.chat_message_repository
      .createQueryBuilder("message")
      .leftJoinAndSelect("message.chat", "chat")
      .where("message.chat_id = :chat_id", { chat_id })
      .andWhere("message.deleted_at IS NULL")
      .skip(skip)
      .take(take)
      .orderBy(`message.${order_by}`, order_direction);

    const [rows, total] = await qb.getManyAndCount();
    return new PaginatedResult(
      rows.map((row) => this.mapRowToChatMessage(row)),
      total,
      pagination.page,
      pagination.limit,
    );
  }

  async delete(id: string): Promise<void> {
    const row = await this.chat_message_repository.preload({
      id,
      deleted_at: new Date(),
    });
    if (!row) return;
    await this.chat_message_repository.save(row);
  }

  async findLatestByChatIds(chat_ids: string[]): Promise<Map<string, ChatLastMessageSnapshot>> {
    if (chat_ids.length === 0) return new Map();

    const rows = await this.chat_message_repository
      .createQueryBuilder("message")
      .distinctOn(["message.chat_id"])
      .where("message.chat_id IN (:...chat_ids)", { chat_ids })
      .andWhere("message.deleted_at IS NULL")
      .orderBy("message.chat_id", "ASC")
      .addOrderBy("message.created_at", "DESC")
      .getMany();

    const map = new Map<string, ChatLastMessageSnapshot>();
    for (const row of rows) {
      map.set(row.chat_id, {
        chat_id: row.chat_id,
        content: row.content,
        type: row.type,
        created_at: row.created_at,
      });
    }
    return map;
  }

  async markMessagesAsReadForRecipient(
    chat_id: string,
    recipient_id: string,
    last_message_id?: string,
  ): Promise<ChatMessage[]> {
    const qb = this.chat_message_repository
      .createQueryBuilder("message")
      .leftJoinAndSelect("message.chat", "chat")
      .where("message.chat_id = :chat_id", { chat_id })
      .andWhere("message.sender_id != :recipient_id", { recipient_id })
      .andWhere("message.deleted_at IS NULL")
      .andWhere("message.status IN (:...statuses)", {
        statuses: [CHAT_MESSAGE_STATUS.SENT, CHAT_MESSAGE_STATUS.DELIVERED],
      });

    if (last_message_id) {
      const anchor = await this.chat_message_repository.findOne({
        where: { id: last_message_id, chat_id },
      });
      if (anchor) {
        qb.andWhere("message.created_at <= :anchor_created_at", {
          anchor_created_at: anchor.created_at,
        });
      }
    }

    const rows = await qb.getMany();
    const updated: ChatMessage[] = [];

    for (const row of rows) {
      const message = this.mapRowToChatMessage(row);
      const next = message.update({ status: CHAT_MESSAGE_STATUS.READ });
      await this.save(next);
      updated.push(next);
    }

    return updated;
  }

  async markMessagesAsDeliveredForRecipient(
    chat_id: string,
    recipient_id: string,
  ): Promise<ChatMessage[]> {
    const rows = await this.chat_message_repository
      .createQueryBuilder("message")
      .leftJoinAndSelect("message.chat", "chat")
      .where("message.chat_id = :chat_id", { chat_id })
      .andWhere("message.sender_id != :recipient_id", { recipient_id })
      .andWhere("message.deleted_at IS NULL")
      .andWhere("message.status = :status", { status: CHAT_MESSAGE_STATUS.SENT })
      .getMany();

    const updated: ChatMessage[] = [];
    for (const row of rows) {
      const message = this.mapRowToChatMessage(row);
      const next = message.update({ status: CHAT_MESSAGE_STATUS.DELIVERED });
      await this.save(next);
      updated.push(next);
    }
    return updated;
  }

  private mapRowToChatMessage(row: ChatMessageEntity): ChatMessage {
    const chat_message = new ChatMessage();
    chat_message.id = row.id;
    chat_message.sender_id = row.sender_id;
    chat_message.content = row.content;
    chat_message.type = row.type;
    chat_message.status = row.status;
    chat_message.metadata = row.metadata ?? null;
    chat_message.edited_at = row.edited_at ?? null;
    chat_message.created_at = row.created_at;
    chat_message.updated_at = row.updated_at;
    chat_message.deleted_at = row.deleted_at ?? null;
    chat_message.chat = this.mapRowToChat(row.chat);
    return chat_message;
  }

  private mapRowToChat(row: ChatMessageEntity["chat"]): Chat {
    const chat = new Chat();
    chat.id = row.id;
    chat.participants = row.participants;
    chat.chat_type = row.chat_type;
    chat.vehicle_id = row.vehicle_id;
    chat.created_at = row.created_at;
    chat.updated_at = row.updated_at;
    return chat;
  }
}
