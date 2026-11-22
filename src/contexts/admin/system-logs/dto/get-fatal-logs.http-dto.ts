import { IsIn, IsInt, IsOptional, Max, Min } from "class-validator";

import {
  FATAL_LOG_ROLES,
  type FatalLogRole,
} from "@/src/common/fatal-log/fatal-log";

export class GetFatalLogsHttpDto {
  @IsOptional()
  @IsIn([...FATAL_LOG_ROLES, "all"])
  role: FatalLogRole | "all" = "all";

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(500)
  limit = 50;
}
