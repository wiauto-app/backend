import {
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import type { UIMessage } from "ai";
import { Repository } from "typeorm";
import { AssistantConversationEntity } from "../entities/assistant-conversation.entity";
import { buildConversationTitle } from "../helpers/build-conversation-title";
import { stripNulBytes } from "../helpers/strip-nul-bytes";

export interface AssistantConversationListItem  {
  id: string;
  title: string;
  updated_at: Date;
};

@Injectable()
export class AssistantConversationService {
  private readonly logger = new Logger(AssistantConversationService.name);

  constructor(
    @InjectRepository(AssistantConversationEntity)
    private readonly conversationRepository: Repository<AssistantConversationEntity>,
  ) {}

  async listByUser(userId: string): Promise<AssistantConversationListItem[]> {
    return this.conversationRepository.find({
      where: { user_id: userId },
      select: ["id", "title", "updated_at"],
      order: { updated_at: "DESC" },
    });
  }

  async create(userId: string): Promise<AssistantConversationEntity> {
    const conversation = this.conversationRepository.create({
      user_id: userId,
      title: "Nueva conversación",
      messages: [],
    });
    return this.conversationRepository.save(conversation);
  }

  async findByIdForUser(
    userId: string,
    id: string,
  ): Promise<AssistantConversationEntity> {
    const conversation = await this.conversationRepository.findOne({
      where: { id, user_id: userId },
    });

    if (!conversation) {
      throw new NotFoundException("Conversación no encontrada");
    }

    return conversation;
  }

  async delete(userId: string, id: string): Promise<void> {
    const conversation = await this.findByIdForUser(userId, id);
    await this.conversationRepository.remove(conversation);
  }

  async updateTitle(
    userId: string,
    id: string,
    title: string,
  ): Promise<AssistantConversationEntity> {
    await this.findByIdForUser(userId, id);

    const conversation = await this.conversationRepository.preload({
      id,
      title: title.trim(),
    });

    if (!conversation) {
      throw new NotFoundException("Conversación no encontrada");
    }

    return this.conversationRepository.save(conversation);
  }

  async saveMessages(
    userId: string,
    conversationId: string,
    messages: UIMessage[],
  ): Promise<AssistantConversationEntity | undefined> {
    const existing = await this.findByIdForUser(userId, conversationId);

    // Postgres rejects NUL bytes (\u0000) inside text/jsonb columns, and a
    // chat message can legitimately contain one (e.g. pasted binary-ish
    // text). Strip them from everything we're about to persist.
    const sanitizedMessages = stripNulBytes(messages);
    const title = stripNulBytes(
      existing.title === "Nueva conversación"
        ? buildConversationTitle(sanitizedMessages)
        : existing.title,
    );

    try {
      const conversation = await this.conversationRepository.preload({
        id: conversationId,
        messages: sanitizedMessages,
        title,
      });

      if (!conversation) {
        throw new NotFoundException("Conversación no encontrada");
      }

      return await this.conversationRepository.save(conversation);
    } catch (error) {
      // A persistence failure here must never crash the process: the user
      // already received the streamed answer, so losing the persisted copy
      // of this one turn is an acceptable degraded outcome.
      this.logger.error(
        `No se pudo guardar la conversación ${conversationId}`,
        error as Error,
      );
      return undefined;
    }
  }

  async resolveConversationId(
    userId: string,
    conversationId?: string,
  ): Promise<string> {
    if (conversationId) {
      await this.findByIdForUser(userId, conversationId);
      return conversationId;
    }

    const created = await this.create(userId);
    return created.id;
  }
}
