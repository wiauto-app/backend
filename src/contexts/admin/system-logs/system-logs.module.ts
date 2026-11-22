import { Module } from "@nestjs/common";

import { FatalLogsController } from "./api/fatal-logs.controller";
import { FatalLogsService } from "./services/fatal-logs.service";

@Module({
  controllers: [FatalLogsController],
  providers: [FatalLogsService],
})
export class SystemLogsModule {}
