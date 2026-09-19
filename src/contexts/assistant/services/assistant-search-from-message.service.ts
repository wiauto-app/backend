import { Injectable } from "@nestjs/common";
import { generateId, UIMessage } from "ai";
import { mergeSearchVehiclesInput } from "../helpers/merge-search-vehicles-input";
import { normalizeTypeCategoryFilters } from "../helpers/normalize-type-category-filters";
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
  /**
   * Filters applied in a previous turn of the same conversation (e.g. the
   * previous `searchVehicles` tool output's `appliedFilters`). When present,
   * they're used as the base for a shallow merge with the filters derived
   * from `message` so multi-turn follow-ups carry forward context instead
   * of replacing it outright. See the merge in `resolveFromMessage` below.
   */
  previousFilters?: SearchVehiclesInput;
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
    previousFilters,
  }: SearchFromMessageInput): Promise<SearchFromMessageContext> {
    const messages = buildUIMessagesFromText(message);
    const rawIntent = await this.intentExtractor.extract(messages);
    const intent = sanitizeAssistantIntent(rawIntent, message);
    const resolved = await this.entityResolver.resolve(intent);
    const catalog = await this.filterCatalogService.getCatalog();
    const rawFilters = await this.searchFiltersBuilder.build({
      messages,
      catalog,
      intent,
      resolved,
    });
    const extractedFilters = normalizeTypeCategoryFilters(
      rawFilters,
      catalog,
      intent,
    );

    // Intent extraction above only ever looks at the newest user message
    // (see extractLastUserMessage), so on its own it would make every
    // follow-up REPLACE the previous turn's filters instead of refining
    // them. Merge on top of `previousFilters` (the last applied filters in
    // this conversation) so unmentioned fields carry over.
    //
    // This is a shallow merge, not a smart "carry forward unless
    // contradicted" merge: any key present on `extractedFilters` fully
    // replaces the same key from `previousFilters`, including array fields
    // like `makes_slugs`/`fuel_type_slugs` (a new mention REPLACES the
    // array, it doesn't append to it). That matches the common case ("y de
    // gasolina" adding fuel on top of an existing make/location) because
    // `restrictFiltersToExplicitIntent` only sets a key when this turn's
    // message explicitly addresses it, so unrelated keys stay `undefined`
    // and are simply carried over. Known simplification: a message that
    // re-specifies a field the user meant to ADD to (rather than replace)
    // will drop the earlier values for that field. Good enough for a first
    // correct-enough fix.
    const filters = mergeSearchVehiclesInput(previousFilters, extractedFilters);
    validateSearchVehiclesFilters(filters, catalog, resolved);

    return { filters, catalog, resolved };
  }
}
