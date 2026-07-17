import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { Chat } from "../types/chat";
import { PaginationFilter } from "@/src/contexts/shared/types/pagination.filter";
import { PaginatedResult } from "@/src/contexts/shared/types/paginated-result.vo";
import { ChatEntity } from "../entities/chat.entity";

const CHAT_SORT_KEYS = new Set([
  "id",
  "chat_type",
  "vehicle_id",
  "created_at",
  "updated_at"]);

export class TypeOrmChatRepository {
  constructor(
    @InjectRepository(ChatEntity)
    private readonly chat_repository: Repository<ChatEntity>,
  ) {
  }

  async save(chat: Chat): Promise<void> {
    await this.chat_repository.save({
      id: chat.id,
      participants: chat.participants,
      chat_type: chat.chat_type,
      vehicle_id: chat.vehicle_id,
      created_at: chat.created_at,
      updated_at: chat.updated_at,
    });
  }

  async findOne(id: string): Promise<Chat | null> {
    const row = await this.chat_repository.findOne({ where: { id } });
    if (!row) return null;
    return this.mapRowToChat(row);
  }

  async findByParticipantsIds(
    participants_ids: string[],
    pagination: PaginationFilter,
  ): Promise<PaginatedResult<Chat>> {
    const skip = (pagination.page - 1) * pagination.limit;
    const take = pagination.limit;
    const order_by =
      pagination.order_by && CHAT_SORT_KEYS.has(pagination.order_by)
        ? pagination.order_by
        : "created_at";
    const order_direction = pagination.order_direction;

    const qb = this.chat_repository
      .createQueryBuilder("chat")
      .where("chat.participants @> :participant", {
        participant: JSON.stringify(participants_ids),
      })
      .skip(skip)
      .take(take)
      .orderBy(`chat.${order_by}`, order_direction);


    const [rows, total] = await qb.getManyAndCount();

    return new PaginatedResult(
      rows.map((row) => this.mapRowToChat(row)),
      total,
      pagination.page,
      pagination.limit,
    );
  }

  async chatExists(participants_ids: string[], vehicle_id: string | null): Promise<boolean> {
    const row = await this.findChatRowByParticipantsAndVehicle(participants_ids, vehicle_id);
    return row !== null;
  }

  async findOneByParticipantsAndVehicle(
    participants_ids: string[],
    vehicle_id: string | null,
  ): Promise<Chat | null> {
    const row = await this.findChatRowByParticipantsAndVehicle(participants_ids, vehicle_id);
    return row ? this.mapRowToChat(row) : null;
  }

  private async findChatRowByParticipantsAndVehicle(
    participants_ids: string[],
    vehicle_id: string | null,
  ): Promise<ChatEntity | null> {
    return this.chat_repository
      .createQueryBuilder("chat")
      .where("chat.participants @> :participants", {
        participants: JSON.stringify(participants_ids),
      })
      .andWhere("chat.vehicle_id = :vehicle_id", { vehicle_id })
      .getOne();
  }

  async delete(id: string): Promise<void> {
    await this.chat_repository.delete(id);
  }

  private mapRowToChat(row: ChatEntity): Chat {
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

