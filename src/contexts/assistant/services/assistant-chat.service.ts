import { Injectable } from "@nestjs/common";
import { envs } from "@/src/common/envs";
import {
  convertToModelMessages,
  createUIMessageStream,
  generateId,
  pipeUIMessageStreamToResponse,
  stepCountIs,
  streamText,
  UIMessage,
} from "ai";
import { createDeepSeek } from "@ai-sdk/deepseek";
import type { Response } from "express";
import { extractLastUserMessage } from "../helpers/extract-last-user-message";
import type { SearchVehiclesInput } from "../schemas/search-vehicles.schema";
import type { AssistantChatMode } from "../types/assistant-chat-mode";
import { AssistantSearchExecutorService } from "./assistant-search-executor.service";
import { AssistantSearchFromMessageService } from "./assistant-search-from-message.service";
import { AssistantSystemPromptService } from "./assistant-system-prompt.service";
import { AssistantBuySystemPromptService } from "./assistant-buy-system-prompt.service";
import { AssistantConversationService } from "./assistant-conversation.service";
import { AssistantQuotaService } from "./assistant-quota.service";
import { AssistantBuyToolsService } from "../tools/assistant-buy-tools.service";
import { AssistantFilterCatalogService } from "./assistant-filter-catalog.service";

interface StreamChatOptions {
  messages: UIMessage[];
  conversationId?: string;
  userId: string;
  response: Response;
  mode?: AssistantChatMode;
  initialFilters?: SearchVehiclesInput;
}

@Injectable()
export class AssistantChatService {
  constructor(
    private readonly systemPromptService: AssistantSystemPromptService,
    private readonly buySystemPromptService: AssistantBuySystemPromptService,
    private readonly searchFromMessageService: AssistantSearchFromMessageService,
    private readonly searchExecutor: AssistantSearchExecutorService,
    private readonly conversationService: AssistantConversationService,
    private readonly quotaService: AssistantQuotaService,
    private readonly buyToolsService: AssistantBuyToolsService,
    private readonly filterCatalogService: AssistantFilterCatalogService,
  ) { }

  async streamChat({
    messages,
    conversationId,
    userId,
    response,
    mode = "search",
    initialFilters,
  }: StreamChatOptions): Promise<void> {
    await this.quotaService.assertCanConsume(userId);

    const resolvedConversationId =
      await this.conversationService.resolveConversationId(
        userId,
        conversationId,
      );

    await this.quotaService.consume(userId);

    if (mode === "buy_assistant") {
      await this.streamBuyAssistantChat({
        messages,
        resolvedConversationId,
        userId,
        response,
        initialFilters,
      });
      return;
    }

    await this.streamSearchChat({
      messages,
      resolvedConversationId,
      userId,
      response,
    });
  }

  private async streamBuyAssistantChat({
    messages,
    resolvedConversationId,
    userId,
    response,
    initialFilters,
  }: {
    messages: UIMessage[];
    resolvedConversationId: string;
    userId: string;
    response: Response;
    initialFilters?: SearchVehiclesInput;
  }): Promise<void> {
    const catalog = await this.filterCatalogService.getCatalog();
    const deepseek = createDeepSeek({
      apiKey: envs.DEEPSEEK_API_KEY,
    });
    const tools = this.buyToolsService.createBuyAssistantTools({
      initialFilters,
      catalog,
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
        const result = streamText({
          model: deepseek(envs.DEEPSEEK_MODEL),
          system: this.buySystemPromptService.build({
            initialFilters,
            catalog,
          }),
          messages: await convertToModelMessages(messages, { tools }),
          tools,
          stopWhen: stepCountIs(6),
        });

        writer.merge(
          result.toUIMessageStream({
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

  private async streamSearchChat({
    messages,
    resolvedConversationId,
    userId,
    response,
  }: {
    messages: UIMessage[];
    resolvedConversationId: string;
    userId: string;
    response: Response;
  }): Promise<void> {
    const userMessage = extractLastUserMessage(messages);
    const { filters, catalog, resolved } =
      await this.searchFromMessageService.resolveFromMessage({
        message: userMessage,
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
