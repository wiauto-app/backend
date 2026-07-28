import { Type } from "class-transformer";
import { IsEnum, IsInt, IsOptional, Max, Min } from "class-validator";

import {
  APPRAISAL_REQUEST_PRIORITY,
  APPRAISAL_REQUEST_STATUS,
} from "../types/appraisal-request";

export class FindAllAppraisalRequestsHttpDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 10;

  @IsOptional()
  @IsEnum(APPRAISAL_REQUEST_STATUS)
  status?: (typeof APPRAISAL_REQUEST_STATUS)[keyof typeof APPRAISAL_REQUEST_STATUS];

  @IsOptional()
  @IsEnum(APPRAISAL_REQUEST_PRIORITY)
  priority?: (typeof APPRAISAL_REQUEST_PRIORITY)[keyof typeof APPRAISAL_REQUEST_PRIORITY];
}
