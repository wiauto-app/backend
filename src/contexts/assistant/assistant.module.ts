import { Module, forwardRef } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ProfileEntity } from "@/src/contexts/profiles/entities/profile.entity";
import { VehiclesModule } from "@/src/contexts/vehicles/vehicles.module";
import { CatalogModule } from "@/src/contexts/vehicles/catalog/catalog.module";
import { BillingModule } from "@/src/contexts/billing/billing.module";
import { DealershipModule } from "@/src/contexts/dealership/dealership.module";
import { AiSearchFiltersController } from "./api/ai-search-filters.controller";
import { AssistantChatController } from "./api/assistant-chat.controller";
import { AssistantConversationsController } from "./api/assistant-conversations.controller";
import { AssistantQuotaController } from "./api/assistant-quota.controller";
import { AssistantConversationEntity } from "./entities/assistant-conversation.entity";
import { AssistantChatService } from "./services/assistant-chat.service";
import { AssistantConversationService } from "./services/assistant-conversation.service";
import { AssistantEntityResolverService } from "./services/assistant-entity-resolver.service";
import { AssistantFilterCatalogService } from "./services/assistant-filter-catalog.service";
import { AssistantIntentExtractorService } from "./services/assistant-intent-extractor.service";
import { AssistantIntentPromptService } from "./services/assistant-intent-prompt.service";
import { AssistantQuotaService } from "./services/assistant-quota.service";
import { AssistantSearchExecutorService } from "./services/assistant-search-executor.service";
import { AssistantSearchFiltersBuilderService } from "./services/assistant-search-filters-builder.service";
import { AssistantSearchFiltersPromptService } from "./services/assistant-search-filters-prompt.service";
import { AssistantSearchFromMessageService } from "./services/assistant-search-from-message.service";
import { AssistantSystemPromptService } from "./services/assistant-system-prompt.service";
import { AssistantBuySystemPromptService } from "./services/assistant-buy-system-prompt.service";
import { AssistantBuyToolsService } from "./tools/assistant-buy-tools.service";
import { AssistantSuggestionsController } from "./api/assistant-suggestions.controller";
import { AssistantSuggestionsGeneratorService } from "./services/assistant-suggestions-generator.service";
import { AssistantSuggestionsService } from "./services/assistant-suggestions.service";
import { AssistantNewsService } from "./services/assistant-news.service";
import { AssistantContextToolsService } from "./tools/assistant-context-tools.service";
import { AssistantContextSystemPromptService } from "./services/assistant-context-system-prompt.service";

@Module({
  imports: [
    forwardRef(() => VehiclesModule),
    forwardRef(() => BillingModule),
    forwardRef(() => DealershipModule),
    CatalogModule,
    TypeOrmModule.forFeature([AssistantConversationEntity, ProfileEntity]),
  ],
  controllers: [
    AiSearchFiltersController,
    AssistantChatController,
    AssistantConversationsController,
    AssistantQuotaController,
    AssistantSuggestionsController,
  ],
  providers: [
    AssistantChatService,
    AssistantConversationService,
    AssistantFilterCatalogService,
    AssistantSystemPromptService,
    AssistantBuySystemPromptService,
    AssistantBuyToolsService,
    AssistantIntentPromptService,
    AssistantIntentExtractorService,
    AssistantEntityResolverService,
    AssistantSearchFiltersPromptService,
    AssistantSearchFiltersBuilderService,
    AssistantSearchFromMessageService,
    AssistantSearchExecutorService,
    AssistantQuotaService,
    AssistantSuggestionsGeneratorService,
    AssistantSuggestionsService,
    AssistantNewsService,
    AssistantContextToolsService,
    AssistantContextSystemPromptService,
  ],
  exports: [AssistantQuotaService, AssistantSearchFromMessageService],
})
export class AssistantModule {}
