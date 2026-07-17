import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from "@nestjs/common";
import { Throttle, ThrottlerGuard } from "@nestjs/throttler";

import { envs } from "@/src/common/envs";
import { V1_SEARCH_AI_FILTERS } from "@/src/contexts/vehicles/api/route.constants";
import { AssistantSearchFromMessageService } from "../services/assistant-search-from-message.service";
import { AiSearchFiltersHttpDto } from "./ai-search-filters.http-dto";

@Controller(V1_SEARCH_AI_FILTERS)
@UseGuards(ThrottlerGuard)
@Throttle({
  "ai-search-filters": {
    limit: envs.AI_SEARCH_FILTERS_THROTTLE_LIMIT,
    ttl: envs.AI_SEARCH_FILTERS_THROTTLE_TTL_MS,
  },
})
export class AiSearchFiltersController {
  constructor(
    private readonly searchFromMessageService: AssistantSearchFromMessageService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async resolveFilters(@Body() body: AiSearchFiltersHttpDto) {
    const filters = await this.searchFromMessageService.resolve({
      message: body.message,
    });

    return { filters };
  }
}
