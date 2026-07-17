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
import { extractLastUserMessage } from "../helpers/extract-last-user-message";
import { AssistantSearchExecutorService } from "./assistant-search-executor.service";
import { AssistantSearchFromMessageService } from "./assistant-search-from-message.service";
import { AssistantSystemPromptService } from "./assistant-system-prompt.service";
import { AssistantConversationService } from "./assistant-conversation.service";
import { AssistantQuotaService } from "./assistant-quota.service";

interface StreamChatOptions {
  messages: UIMessage[];
  conversationId?: string;
  userId: string;
  response: Response;
}

@Injectable()
export class AssistantChatService {
  constructor(
    private readonly systemPromptService: AssistantSystemPromptService,
    private readonly searchFromMessageService: AssistantSearchFromMessageService,
    private readonly searchExecutor: AssistantSearchExecutorService,
    private readonly conversationService: AssistantConversationService,
    private readonly quotaService: AssistantQuotaService,
  ) {}

  async streamChat({
    messages,
    conversationId,
    userId,
    response,
  }: StreamChatOptions): Promise<void> {
    await this.quotaService.assertCanConsume(userId);

    const resolvedConversationId =
      await this.conversationService.resolveConversationId(
        userId,
        conversationId,
      );

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

    await this.quotaService.consume(userId);

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
