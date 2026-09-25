import { Body, Controller, Patch, UseGuards } from "@nestjs/common";

import { GetUserId } from "@/src/contexts/auth/decorators/GetUserId.decorator";
import { JwtGuard } from "@/src/contexts/auth/guards/auth.guard";

import {
  V1_LEAD_ASSISTANT,
  V1_LEAD_ASSISTANT_SETTINGS,
} from "../route.constants";
import { LeadAssistantSettingsService } from "../../services/lead-assistant-settings.service";
import { PatchLeadAssistantSettingsHttpDto } from "./patch-lead-assistant-settings.http-dto";

@Controller(V1_LEAD_ASSISTANT)
@UseGuards(JwtGuard)
export class PatchLeadAssistantSettingsController {
  constructor(
    private readonly lead_assistant_settings_service: LeadAssistantSettingsService,
  ) {}

  @Patch(V1_LEAD_ASSISTANT_SETTINGS)
  run(
    @GetUserId() profile_id: string,
    @Body() body: PatchLeadAssistantSettingsHttpDto,
  ) {
    return this.lead_assistant_settings_service.patch(profile_id, body);
  }
}
