import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";

import { GetUserId } from "@/src/contexts/auth/decorators/GetUserId.decorator";
import { JwtGuard } from "@/src/contexts/auth/guards/auth.guard";
import { NotificationInboxService } from "@/src/contexts/alerts/services/notification-inbox.service";

import { V1_ALERTS } from "../../route.constants";
import { FindInboxNotificationsHttpDto } from "./find-inbox-notifications.http-dto";

@Controller(`${V1_ALERTS}/notifications`)
@UseGuards(JwtGuard)
export class NotificationInboxController {
  constructor(
    private readonly notification_inbox_service: NotificationInboxService,
  ) {}

  @Get()
  findAll(
    @GetUserId() profile_id: string,
    @Query() query: FindInboxNotificationsHttpDto,
  ) {
    return this.notification_inbox_service.findAll({
      profile_id,
      page: query.page,
      limit: query.limit,
    });
  }

  @Post("read-all")
  markAllAsRead(@GetUserId() profile_id: string) {
    return this.notification_inbox_service.markAllAsRead({ profile_id });
  }

  @Patch(":id/read")
  markAsRead(
    @GetUserId() profile_id: string,
    @Param("id", new ParseUUIDPipe()) notification_id: string,
  ) {
    return this.notification_inbox_service.markAsRead({
      profile_id,
      notification_id,
    });
  }
}
