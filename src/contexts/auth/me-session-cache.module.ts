import { Module } from "@nestjs/common";

import { MeSessionCacheService } from "./services/me-session-cache.service";

@Module({
  providers: [MeSessionCacheService],
  exports: [MeSessionCacheService],
})
export class MeSessionCacheModule {}
