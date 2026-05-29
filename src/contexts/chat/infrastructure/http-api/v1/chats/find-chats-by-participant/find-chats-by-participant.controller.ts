import { Controller, Get, Query, UseGuards } from "@nestjs/common";

import { JwtGuard } from "@/src/contexts/auth/guards/auth.guard";
import { GetUserId } from "@/src/contexts/auth/decorators/GetUserId.decorator";
import { PaginationHttpDto } from "@/src/contexts/shared/infrastructure/http-dtos/pagination.http-dto";
import { FindChatsByParticipantUseCase } from "@/src/contexts/chat/application/chat-use-cases/find-chats-by-participant-use-case/find-chats-by-participant.use-case";

import { V1_CHATS } from "../../../route.constants";

@Controller(V1_CHATS)
@UseGuards(JwtGuard)
export class FindChatsByParticipantController {
  constructor(
    private readonly find_chats_by_participant_use_case: FindChatsByParticipantUseCase,
  ) {}

  @Get()
  run(@GetUserId() participant_id: string, @Query() query: PaginationHttpDto) {
    return this.find_chats_by_participant_use_case.execute({
      participants_ids: [participant_id],
      requesting_user_id: participant_id,
      page: query.page,
      limit: query.limit,
      order_direction: query.order_direction,
      query: query.query,
      order_by: query.order_by,
      search: query.search,
    });
  }
}

