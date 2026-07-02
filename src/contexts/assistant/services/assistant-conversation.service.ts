import {
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import type { UIMessage } from "ai";
import { Repository } from "typeorm";
import { AssistantConversationEntity } from "../entities/assistant-conversation.entity";
import { buildConversationTitle } from "../helpers/build-conversation-title";

export type AssistantConversationListItem = {
  id: string;
  title: string;
  updated_at: Date;
};

@Injectable()
export class AssistantConversationService {
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
  ): Promise<AssistantConversationEntity> {
    const existing = await this.findByIdForUser(userId, conversationId);
    const title =
      existing.title === "Nueva conversación"
        ? buildConversationTitle(messages)
        : existing.title;

    const conversation = await this.conversationRepository.preload({
      id: conversationId,
      messages,
      title,
    });

    if (!conversation) {
      throw new NotFoundException("Conversación no encontrada");
    }

    return this.conversationRepository.save(conversation);
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
