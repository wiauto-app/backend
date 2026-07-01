import { Body, Controller, HttpCode, HttpStatus, Post, Res } from "@nestjs/common";
import { Response } from "express";
import { V1_ASSISTANT } from "../route.constants";
import { AssistantChatService } from "../services/assistant-chat.service";
import { AssistantChatDto } from "../dto/assistant-chat.dto";

@Controller(V1_ASSISTANT)
export class AssistantChatController {
  constructor(private readonly assistantChatService: AssistantChatService) {}

  @Post("chat")
  @HttpCode(HttpStatus.OK)
  async chat(
    @Body() body: AssistantChatDto,
    @Res() response: Response,
  ): Promise<void> {
    console.log("body", JSON.stringify(body, null, 2));
    await this.assistantChatService.streamChat(body.messages, response);
  }
}
