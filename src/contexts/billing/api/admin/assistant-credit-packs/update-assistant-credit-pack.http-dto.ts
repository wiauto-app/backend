import { PartialType } from "@nestjs/mapped-types";

import { CreateAssistantCreditPackHttpDto } from "./create-assistant-credit-pack.http-dto";

export class UpdateAssistantCreditPackHttpDto extends PartialType(
  CreateAssistantCreditPackHttpDto,
) {}
