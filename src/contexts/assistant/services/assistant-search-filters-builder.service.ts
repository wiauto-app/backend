import { Injectable } from "@nestjs/common";
import { envs } from "@/src/common/envs";
import { generateObject, UIMessage } from "ai";
import { createDeepSeek } from "@ai-sdk/deepseek";
import { extractLastUserMessage } from "../helpers/extract-last-user-message";
import {
  searchVehiclesInputSchema,
  SearchVehiclesInput,
} from "../schemas/search-vehicles.schema";
import { AssistantFilterCatalog } from "../types/assistant-filter-catalog";
import { AssistantResolvedEntities } from "../types/assistant-resolved-entities";
import { AssistantSearchFiltersPromptService } from "./assistant-search-filters-prompt.service";

const DEFAULT_RADIUS_METERS = 25_000;

@Injectable()
export class AssistantSearchFiltersBuilderService {
  constructor(
    private readonly searchFiltersPromptService: AssistantSearchFiltersPromptService,
  ) {}

  async build(params: {
    messages: UIMessage[];
    catalog: AssistantFilterCatalog;
    resolved: AssistantResolvedEntities;
  }): Promise<SearchVehiclesInput> {
    const userMessage = extractLastUserMessage(params.messages);

    const deepseek = createDeepSeek({
      apiKey: envs.DEEPSEEK_API_KEY,
    });

    const { object } = await generateObject({
      model: deepseek(envs.DEEPSEEK_MODEL),
      schema: searchVehiclesInputSchema,
      prompt: this.searchFiltersPromptService.build({
        userMessage,
        catalog: params.catalog,
        resolved: params.resolved,
      }),
    });

    return this.applyResolvedEntities(object, params.resolved);
  }

  private applyResolvedEntities(
    filters: SearchVehiclesInput,
    resolved: AssistantResolvedEntities,
  ): SearchVehiclesInput {
    const next: SearchVehiclesInput = { ...filters };

    if (resolved.make_slug) {
      next.makes_slugs = [resolved.make_slug];
    }

    if (resolved.model_slug) {
      next.models_slugs = [resolved.model_slug];
    }

    if (resolved.lat !== undefined) {
      next.lat = resolved.lat;
    }

    if (resolved.lng !== undefined) {
      next.lng = resolved.lng;
    }

    if (next.lat !== undefined && next.lng !== undefined && next.radius === undefined) {
      next.radius = DEFAULT_RADIUS_METERS;
    }

    return next;
  }
}
