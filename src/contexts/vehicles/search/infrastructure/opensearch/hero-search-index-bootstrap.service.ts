import { Injectable, OnModuleInit } from "@nestjs/common";
import { Logger } from "@nestjs/common";

import { HeroSearchRepository } from "../../domain/ports/hero-search.repository";

@Injectable()
export class HeroSearchIndexBootstrapService implements OnModuleInit {
  private readonly logger = new Logger(HeroSearchIndexBootstrapService.name);

  constructor(private readonly hero_search_repository: HeroSearchRepository) {}

  async onModuleInit(): Promise<void> {
    try {
      await this.hero_search_repository.ensureIndex();
    } catch (error) {
      this.logger.warn(
        "OpenSearch index bootstrap failed; hero facets may be unavailable until OpenSearch is up",
        error instanceof Error ? error.message : String(error),
      );
    }
  }
}
