import { Injectable } from "@nestjs/common";
import { envs } from "@/src/common/envs";
import { generateText, Output, UIMessage } from "ai";
import { createDeepSeek } from "@ai-sdk/deepseek";
import { z } from "zod";
import { extractLastUserMessage } from "../helpers/extract-last-user-message";
import { AssistantIntent } from "../types/assistant-intent";
import { AssistantIntentPromptService } from "./assistant-intent-prompt.service";

const assistantIntentSchema = z.object({
  make: z.string().optional(),
  model: z.string().optional(),
  vehicle_type: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
});

@Injectable()
export class AssistantIntentExtractorService {
  constructor(
    private readonly intentPromptService: AssistantIntentPromptService,
  ) {}

  async extract(messages: UIMessage[]): Promise<AssistantIntent> {
    const userMessage = extractLastUserMessage(messages);

    if (userMessage.length === 0) {
      return {};
    }

    const deepseek = createDeepSeek({
      apiKey: envs.DEEPSEEK_API_KEY,
    });

    const { output } = await generateText({
      model: deepseek(envs.DEEPSEEK_MODEL),
      output: Output.object({
        schema: assistantIntentSchema,
      }),
      prompt: this.intentPromptService.build(userMessage),
    });

    return output;
  }
}
