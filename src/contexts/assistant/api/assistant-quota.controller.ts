import { Controller, Get, UseGuards } from "@nestjs/common";
import { GetUserId } from "@/src/contexts/auth/decorators/GetUserId.decorator";
import { JwtGuard } from "@/src/contexts/auth/guards/auth.guard";
import { V1_ASSISTANT } from "../route.constants";
import { AssistantQuotaService } from "../services/assistant-quota.service";

@Controller(V1_ASSISTANT)
@UseGuards(JwtGuard)
export class AssistantQuotaController {
  constructor(private readonly assistantQuotaService: AssistantQuotaService) {}

  @Get("quota")
  getQuota(@GetUserId() userId: string) {
    return this.assistantQuotaService.getBalance(userId);
  }
}
