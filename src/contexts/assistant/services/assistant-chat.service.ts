import { Injectable } from "@nestjs/common";
import { envs } from "@/src/common/envs";
import {
  convertToModelMessages,
  createUIMessageStream,
  generateId,
  pipeUIMessageStreamToResponse,
  streamText,
  UIMessage,
} from "ai";
import { createDeepSeek } from "@ai-sdk/deepseek";
import type { Response } from "express";
import { AssistantEntityResolverService } from "./assistant-entity-resolver.service";
import { AssistantFilterCatalogService } from "./assistant-filter-catalog.service";
import { AssistantIntentExtractorService } from "./assistant-intent-extractor.service";
import { AssistantSearchExecutorService } from "./assistant-search-executor.service";
import { AssistantSearchFiltersBuilderService } from "./assistant-search-filters-builder.service";
import { AssistantSystemPromptService } from "./assistant-system-prompt.service";
import { AssistantConversationService } from "./assistant-conversation.service";

interface StreamChatOptions {
  messages: UIMessage[];
  conversationId?: string;
  userId: string;
  response: Response;
};

@Injectable()
export class AssistantChatService {
  constructor(
    private readonly filterCatalogService: AssistantFilterCatalogService,
    private readonly systemPromptService: AssistantSystemPromptService,
    private readonly intentExtractor: AssistantIntentExtractorService,
    private readonly entityResolver: AssistantEntityResolverService,
    private readonly searchFiltersBuilder: AssistantSearchFiltersBuilderService,
    private readonly searchExecutor: AssistantSearchExecutorService,
    private readonly conversationService: AssistantConversationService,
  ) {}

  async streamChat({
    messages,
    conversationId,
    userId,
    response,
  }: StreamChatOptions): Promise<void> {
    const resolvedConversationId =
      await this.conversationService.resolveConversationId(
        userId,
        conversationId,
      );

    const intent = await this.intentExtractor.extract(messages);
    const resolved = await this.entityResolver.resolve(intent);
    const catalog = await this.filterCatalogService.getCatalog();
    const filters = await this.searchFiltersBuilder.build({
      messages,
      catalog,
      resolved,
    });
    const searchResult = await this.searchExecutor.execute(
      filters,
      catalog,
      resolved,
    );

    const deepseek = createDeepSeek({
      apiKey: envs.DEEPSEEK_API_KEY,
    });

    const stream = createUIMessageStream({
      originalMessages: messages,
      onEnd: async ({ messages: updatedMessages }) => {
        await this.conversationService.saveMessages(
          userId,
          resolvedConversationId,
          updatedMessages,
        );
      },
      execute: async ({ writer }) => {
        const toolCallId = generateId();

        writer.write({
          type: "tool-input-start",
          toolCallId,
          toolName: "searchVehicles",
        });
        writer.write({
          type: "tool-input-available",
          toolCallId,
          toolName: "searchVehicles",
          input: filters,
        });
        writer.write({
          type: "tool-output-available",
          toolCallId,
          output: searchResult,
        });

        const summary = streamText({
          model: deepseek(envs.DEEPSEEK_MODEL),
          system: this.systemPromptService.build(searchResult),
          messages: await convertToModelMessages(messages),
        });

        writer.merge(
          summary.toUIMessageStream({
            sendStart: false,
            originalMessages: messages,
          }),
        );
      },
    });

    pipeUIMessageStreamToResponse({
      response,
      headers: {
        "X-Conversation-Id": resolvedConversationId,
      },
      stream,
    });
  }
}
