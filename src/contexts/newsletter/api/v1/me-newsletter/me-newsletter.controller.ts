import { Body, Controller, Get, Patch, UseGuards } from "@nestjs/common";

import { GetUserId } from "@/src/contexts/auth/decorators/GetUserId.decorator";
import { JwtGuard } from "@/src/contexts/auth/guards/auth.guard";

import { UpdateNewsletterPreferencesHttpDto } from "../../../dto/update-newsletter-preferences.http-dto";
import { NewsletterService } from "../../../services/newsletter.service";
import { V1_NEWSLETTER } from "../../route.constants";

@Controller(`${V1_NEWSLETTER}/me`)
@UseGuards(JwtGuard)
export class MeNewsletterController {
  constructor(private readonly newsletter_service: NewsletterService) {}

  @Get()
  getMe(@GetUserId() profile_id: string) {
    return this.newsletter_service.getOrCreateForProfile(profile_id);
  }

  @Patch()
  updateMe(
    @GetUserId() profile_id: string,
    @Body() body: UpdateNewsletterPreferencesHttpDto,
  ) {
    return this.newsletter_service.updatePreferences(profile_id, body);
  }
}
