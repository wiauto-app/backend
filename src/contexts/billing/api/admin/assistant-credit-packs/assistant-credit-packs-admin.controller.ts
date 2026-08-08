import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from "@nestjs/common";

import { AuthAdmin } from "@/src/contexts/auth/decorators/auth-admin.decorator";
import { PaginationHttpDto } from "@/src/contexts/shared/dto/pagination.http-dto";

import { AssistantCreditPacksService } from "../../../services/assistant-credit-packs.service";
import { V1_BILLING_ASSISTANT_CREDIT_PACKS } from "../../route.constants";
import { CreateAssistantCreditPackHttpDto } from "./create-assistant-credit-pack.http-dto";
import { UpdateAssistantCreditPackHttpDto } from "./update-assistant-credit-pack.http-dto";

@AuthAdmin()
@Controller(V1_BILLING_ASSISTANT_CREDIT_PACKS)
export class AssistantCreditPacksAdminController {
  constructor(
    private readonly assistant_credit_packs_service: AssistantCreditPacksService,
  ) {}

  @Post()
  create(@Body() body: CreateAssistantCreditPackHttpDto) {
    return this.assistant_credit_packs_service.create(body);
  }

  @Get()
  findAll(@Query() query: PaginationHttpDto & { search?: string }) {
    return this.assistant_credit_packs_service.findAll({
      page: query.page,
      limit: query.limit,
      search: query.search,
    });
  }

  @Get(":id")
  findOne(@Param("id", ParseUUIDPipe) id: string) {
    return this.assistant_credit_packs_service.findOne(id);
  }

  @Patch(":id")
  update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() body: UpdateAssistantCreditPackHttpDto,
  ) {
    return this.assistant_credit_packs_service.update(id, body);
  }

  @Delete(":id")
  remove(@Param("id", ParseUUIDPipe) id: string) {
    return this.assistant_credit_packs_service.remove(id);
  }

  @Post(":id/sync-stripe")
  syncStripe(@Param("id", ParseUUIDPipe) id: string) {
    return this.assistant_credit_packs_service.syncStripe(id);
  }
}
