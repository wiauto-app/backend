import { Controller, Get, UseGuards } from "@nestjs/common";

import { GetUserId } from "@/src/contexts/auth/decorators/GetUserId.decorator";
import { JwtGuard } from "@/src/contexts/auth/guards/auth.guard";

import {
  V1_LEAD_ASSISTANT,
  V1_LEAD_ASSISTANT_SETTINGS,
} from "../route.constants";
import { LeadAssistantSettingsService } from "../../services/lead-assistant-settings.service";

@Controller(V1_LEAD_ASSISTANT)
@UseGuards(JwtGuard)
export class GetLeadAssistantSettingsController {
  constructor(
    private readonly lead_assistant_settings_service: LeadAssistantSettingsService,
  ) {}

  @Get(V1_LEAD_ASSISTANT_SETTINGS)
  run(@GetUserId() profile_id: string) {
    return this.lead_assistant_settings_service.getForProfile(profile_id);
  }
}
