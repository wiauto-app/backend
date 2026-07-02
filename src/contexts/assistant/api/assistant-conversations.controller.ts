import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import { GetUserId } from "@/src/contexts/auth/decorators/GetUserId.decorator";
import { JwtGuard } from "@/src/contexts/auth/guards/auth.guard";
import { UpdateAssistantConversationDto } from "../dto/update-assistant-conversation.dto";
import { V1_ASSISTANT } from "../route.constants";
import { AssistantConversationService } from "../services/assistant-conversation.service";

@Controller(`${V1_ASSISTANT}/conversations`)
@UseGuards(JwtGuard)
export class AssistantConversationsController {
  constructor(
    private readonly assistantConversationService: AssistantConversationService,
  ) {}

  @Get()
  list(@GetUserId() userId: string) {
    return this.assistantConversationService.listByUser(userId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@GetUserId() userId: string) {
    return this.assistantConversationService.create(userId);
  }

  @Patch(":id")
  updateTitle(
    @GetUserId() userId: string,
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateAssistantConversationDto,
  ) {
    return this.assistantConversationService.updateTitle(userId, id, dto.title);
  }

  @Get(":id")
  findOne(
    @GetUserId() userId: string,
    @Param("id", new ParseUUIDPipe()) id: string,
  ) {
    return this.assistantConversationService.findByIdForUser(userId, id);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @GetUserId() userId: string,
    @Param("id", new ParseUUIDPipe()) id: string,
  ): Promise<void> {
    await this.assistantConversationService.delete(userId, id);
  }
}
