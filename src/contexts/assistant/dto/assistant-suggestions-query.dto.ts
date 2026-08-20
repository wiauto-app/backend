import { IsIn } from "class-validator";
import {
  ASSISTANT_PAGE_ROUTES,
  type AssistantPageRoute,
} from "../types/assistant-page-context";

export class AssistantSuggestionsQueryDto {
  @IsIn(ASSISTANT_PAGE_ROUTES)
  route: AssistantPageRoute;
}
