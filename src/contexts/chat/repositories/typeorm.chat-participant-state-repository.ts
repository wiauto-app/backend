import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { ChatParticipantState } from "../types/chatParticipantState";
import { ChatParticipantStateEntity } from "../entities/chat-participant-state.orm.entity";
import { ChatEntity } from "../entities/chat.entity";

export class TypeOrmChatParticipantStateRepository {
  constructor(
    @InjectRepository(ChatParticipantStateEntity)
    private readonly state_repository: Repository<ChatParticipantStateEntity>,
    @InjectRepository(ChatEntity)
    private readonly chat_repository: Repository<ChatEntity>,
  ) {
  }

  async findOne(chat_id: string, user_id: string): Promise<ChatParticipantState | null> {
    const row = await this.state_repository.findOne({ where: { chat_id, user_id } });
    if (!row) return null;
    return this.mapRowToState(row);
  }

  async save(state: ChatParticipantState): Promise<void> {
    const row = await this.state_repository.preload({
      chat_id: state.chat_id,
      user_id: state.user_id,
      last_read_message_id: state.last_read_message_id,
      last_read_at: state.last_read_at,
      unread_count: state.unread_count,
    });
    if (row) {
      await this.state_repository.save(row);
      return;
    }
    await this.state_repository.save({
      chat_id: state.chat_id,
      user_id: state.user_id,
      last_read_message_id: state.last_read_message_id,
      last_read_at: state.last_read_at,
      unread_count: state.unread_count,
    });
  }

  async incrementUnreadForOthers(chat_id: string, sender_id: string): Promise<void> {
    const chat = await this.chat_repository.findOne({ where: { id: chat_id } });
    if (!chat) return;

    const other_participant_ids = chat.participants.filter(
      (participant_id) => participant_id !== sender_id,
    );

    for (const user_id of other_participant_ids) {
      const existing = await this.findOne(chat_id, user_id);
      if (existing) {
        existing.unread_count += 1;
        await this.save(existing);
        continue;
      }
      await this.save(
        ChatParticipantState.create({
          chat_id,
          user_id,
          unread_count: 1,
        }),
      );
    }
  }

  async resetUnread(
    chat_id: string,
    user_id: string,
    last_read_message_id: string | null,
  ): Promise<void> {
    const existing = await this.findOne(chat_id, user_id);
    const state =
      existing ??
      ChatParticipantState.create({
        chat_id,
        user_id,
      });
    state.unread_count = 0;
    state.last_read_message_id = last_read_message_id;
    state.last_read_at = new Date();
    await this.save(state);
  }

  async getUnreadTotal(user_id: string): Promise<number> {
    const result = await this.state_repository
      .createQueryBuilder("state")
      .select("COALESCE(SUM(state.unread_count), 0)", "total")
      .where("state.user_id = :user_id", { user_id })
      .getRawOne<{ total: string }>();
    return Number(result?.total ?? 0);
  }

  async findByChatIdsForUser(
    chat_ids: string[],
    user_id: string,
  ): Promise<Map<string, ChatParticipantState>> {
    if (chat_ids.length === 0) return new Map();

    const rows = await this.state_repository
      .createQueryBuilder("state")
      .where("state.user_id = :user_id", { user_id })
      .andWhere("state.chat_id IN (:...chat_ids)", { chat_ids })
      .getMany();

    return new Map(rows.map((row) => [row.chat_id, this.mapRowToState(row)]));
  }

  private mapRowToState(row: ChatParticipantStateEntity): ChatParticipantState {
    return ChatParticipantState.create({
      chat_id: row.chat_id,
      user_id: row.user_id,
      last_read_message_id: row.last_read_message_id,
      last_read_at: row.last_read_at,
      unread_count: row.unread_count,
    });
  }
}
