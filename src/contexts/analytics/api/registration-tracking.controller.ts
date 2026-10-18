import {
  Body,
  Controller,
  HttpCode,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from "@nestjs/common";
import type { Request } from "express";

import { JwtGuard } from "@/src/contexts/auth/guards/auth.guard";
import { User } from "@/src/contexts/users/entities/user.entity";
import { RegistrationTrackingHttpDto } from "../dto/registration-tracking.http-dto";
import { MetaCapiService } from "../services/meta-capi.service";

@Controller("v1/analytics")
export class RegistrationTrackingController {
  constructor(private readonly meta_capi_service: MetaCapiService) {}

  @Post("registration")
  @HttpCode(204)
  @UseGuards(JwtGuard)
  async trackRegistration(
    @Body() body: RegistrationTrackingHttpDto,
    @Req() req: Request & { user?: User },
  ): Promise<void> {
    const user = req.user;
    if (!user) {
      throw new UnauthorizedException();
    }

    if (body.consent !== true || !body.eventId.trim()) {
      return;
    }

    const profile = user.profile;
    void this.meta_capi_service.sendMetaEvent({
      eventName: "CompleteRegistration",
      eventId: body.eventId,
      pageUrl: body.pageUrl,
      req,
      fbp: body.fbp,
      fbc: body.fbc,
      user: {
        id: user.id,
        email: user.email,
        phone: profile?.phone ?? undefined,
        firstName: profile?.name,
        lastName: profile?.last_name,
      },
      customData: { method: body.method },
    });
  }
}
