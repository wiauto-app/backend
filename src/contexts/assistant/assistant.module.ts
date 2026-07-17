import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthModule } from "@/src/contexts/auth/auth.module";
import { ProfileEntity } from "@/src/contexts/profiles/entities/profile.entity";
import { VehiclesModule } from "@/src/contexts/vehicles/vehicles.module";
import { CatalogModule } from "@/src/contexts/vehicles/catalog/catalog.module";
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

@Module({
  imports: [
    AuthModule,
    VehiclesModule,
    CatalogModule,
    TypeOrmModule.forFeature([AssistantConversationEntity, ProfileEntity]),
  ],
  controllers: [
    AiSearchFiltersController,
    AssistantChatController,
    AssistantConversationsController,
    AssistantQuotaController,
  ],
  providers: [
    AssistantChatService,
    AssistantConversationService,
    AssistantFilterCatalogService,
    AssistantSystemPromptService,
    AssistantIntentPromptService,
    AssistantIntentExtractorService,
    AssistantEntityResolverService,
    AssistantSearchFiltersPromptService,
    AssistantSearchFiltersBuilderService,
    AssistantSearchFromMessageService,
    AssistantSearchExecutorService,
    AssistantQuotaService,
  ],
  exports: [AssistantQuotaService, AssistantSearchFromMessageService],
})
export class AssistantModule {}
