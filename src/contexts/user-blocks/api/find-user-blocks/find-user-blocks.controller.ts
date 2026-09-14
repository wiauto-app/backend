import { Controller, Get, UseGuards } from "@nestjs/common";

import { GetUserId } from "@/src/contexts/auth/decorators/GetUserId.decorator";
import { JwtGuard } from "@/src/contexts/auth/guards/auth.guard";

import { UserBlocksService } from "../../services/user-blocks.service";
import { V1_BLOCKS } from "../route.constants";

@Controller(V1_BLOCKS)
@UseGuards(JwtGuard)
export class FindUserBlocksController {
  constructor(private readonly userBlocksService: UserBlocksService) {}

  @Get()
  run(@GetUserId() blocker_profile_id: string) {
    return this.userBlocksService.findBlockedBy(blocker_profile_id);
  }
}
