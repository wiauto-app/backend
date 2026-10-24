import { Global, Module } from "@nestjs/common";

import { CatalogReadCacheService } from "./catalog-read-cache.service";

@Global()
@Module({
  providers: [CatalogReadCacheService],
  exports: [CatalogReadCacheService],
})
export class CatalogReadCacheModule {}
