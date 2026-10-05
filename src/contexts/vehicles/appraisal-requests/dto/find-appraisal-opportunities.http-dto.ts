import { Type } from "class-transformer";
import { IsIn, IsInt, IsOptional, Max, Min } from "class-validator";

import {
  APPRAISAL_OPPORTUNITY_SCOPE,
  type AppraisalOpportunityScope,
} from "../services/appraisal-opportunities.service";

export class FindAppraisalOpportunitiesHttpDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit = 12;

  @IsOptional()
  @IsIn(Object.values(APPRAISAL_OPPORTUNITY_SCOPE))
  scope: AppraisalOpportunityScope = APPRAISAL_OPPORTUNITY_SCOPE.OPEN;
}
