import { Injectable } from "@nestjs/common";
import { generateId, UIMessage } from "ai";
import { sanitizeAssistantIntent } from "../helpers/sanitize-assistant-intent";
import { SearchVehiclesInput } from "../schemas/search-vehicles.schema";
import type { AssistantFilterCatalog } from "../types/assistant-filter-catalog";
import type { AssistantResolvedEntities } from "../types/assistant-resolved-entities";
import { AssistantEntityResolverService } from "./assistant-entity-resolver.service";
import { AssistantFilterCatalogService } from "./assistant-filter-catalog.service";
import { AssistantIntentExtractorService } from "./assistant-intent-extractor.service";
import { validateSearchVehiclesFilters } from "./assistant-search-executor.service";
import { AssistantSearchFiltersBuilderService } from "./assistant-search-filters-builder.service";

interface SearchFromMessageInput {
  message: string;
}

interface SearchFromMessageContext {
  filters: SearchVehiclesInput;
  catalog: AssistantFilterCatalog;
  resolved: AssistantResolvedEntities;
}

const buildUIMessagesFromText = (message: string): UIMessage[] => [
  {
    id: generateId(),
    role: "user",
    parts: [{ type: "text", text: message }],
  },
];

@Injectable()
export class AssistantSearchFromMessageService {
  constructor(
    private readonly filterCatalogService: AssistantFilterCatalogService,
    private readonly intentExtractor: AssistantIntentExtractorService,
    private readonly entityResolver: AssistantEntityResolverService,
    private readonly searchFiltersBuilder: AssistantSearchFiltersBuilderService,
  ) {}

  async resolve({ message }: SearchFromMessageInput): Promise<SearchVehiclesInput> {
    const context = await this.resolveFromMessage({ message });
    return context.filters;
  }

  async resolveFromMessage({
    message,
  }: SearchFromMessageInput): Promise<SearchFromMessageContext> {
    const messages = buildUIMessagesFromText(message);
    const rawIntent = await this.intentExtractor.extract(messages);
    const intent = sanitizeAssistantIntent(rawIntent, message);
    const resolved = await this.entityResolver.resolve(intent);
    const catalog = await this.filterCatalogService.getCatalog();
    const filters = await this.searchFiltersBuilder.build({
      messages,
      catalog,
      intent,
      resolved,
    });
    validateSearchVehiclesFilters(filters, catalog, resolved);

    return { filters, catalog, resolved };
  }
}
