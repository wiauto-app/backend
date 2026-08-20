import { Controller, Get, Query } from "@nestjs/common";
import { V1_ASSISTANT } from "../route.constants";
import { AssistantSuggestionsQueryDto } from "../dto/assistant-suggestions-query.dto";
import { AssistantSuggestionsService } from "../services/assistant-suggestions.service";

@Controller(V1_ASSISTANT)
export class AssistantSuggestionsController {
  constructor(private readonly suggestionsService: AssistantSuggestionsService) {}

  @Get("suggestions")
  getSuggestions(@Query() query: AssistantSuggestionsQueryDto) {
    return this.suggestionsService.getForRoute(query.route);
  }
}
