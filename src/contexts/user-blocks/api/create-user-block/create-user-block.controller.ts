import { Body, Controller, Post, UseGuards } from "@nestjs/common";

import { GetUserId } from "@/src/contexts/auth/decorators/GetUserId.decorator";
import { JwtGuard } from "@/src/contexts/auth/guards/auth.guard";

import { CreateUserBlockHttpDto } from "../../dto/create-user-block.http-dto";
import { UserBlocksService } from "../../services/user-blocks.service";
import { V1_BLOCKS } from "../route.constants";

@Controller(V1_BLOCKS)
@UseGuards(JwtGuard)
export class CreateUserBlockController {
  constructor(private readonly userBlocksService: UserBlocksService) {}

  @Post()
  run(
    @GetUserId() blocker_profile_id: string,
    @Body() body: CreateUserBlockHttpDto,
  ) {
    return this.userBlocksService.create(
      blocker_profile_id,
      body.blocked_profile_id,
    );
  }
}
