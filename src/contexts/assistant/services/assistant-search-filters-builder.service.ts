import { Injectable } from "@nestjs/common";
import { envs } from "@/src/common/envs";
import { generateText, Output, UIMessage } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { extractLastUserMessage } from "../helpers/extract-last-user-message";
import { restrictFiltersToExplicitIntent } from "../helpers/restrict-filters-to-intent";
import {
  searchVehiclesInputSchema,
  SearchVehiclesInput,
} from "../schemas/search-vehicles.schema";
import { AssistantFilterCatalog } from "../types/assistant-filter-catalog";
import { AssistantIntent } from "../types/assistant-intent";
import { AssistantResolvedEntities } from "../types/assistant-resolved-entities";
import { AssistantSearchFiltersPromptService } from "./assistant-search-filters-prompt.service";

@Injectable()
export class AssistantSearchFiltersBuilderService {
  constructor(
    private readonly searchFiltersPromptService: AssistantSearchFiltersPromptService,
  ) {}

  async build(params: {
    messages: UIMessage[];
    catalog: AssistantFilterCatalog;
    intent: AssistantIntent;
    resolved: AssistantResolvedEntities;
  }): Promise<SearchVehiclesInput> {
    const userMessage = extractLastUserMessage(params.messages);
    const openai = createOpenAI({
      apiKey: envs.OPENAI_API_KEY,
    });

    const { output } = await generateText({
      model: openai(envs.OPENAI_MODEL),
      output: Output.object({
        schema: searchVehiclesInputSchema,
      }),
      prompt: this.searchFiltersPromptService.build({
        userMessage,
        catalog: params.catalog,
        intent: params.intent,
        resolved: params.resolved,
      }),
      providerOptions: {
        openai: { strictJsonSchema: false },
      },
    });

    return restrictFiltersToExplicitIntent(
      output,
      params.intent,
      params.resolved,
    );
  }
}
