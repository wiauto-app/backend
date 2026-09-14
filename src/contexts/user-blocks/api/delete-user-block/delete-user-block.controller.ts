import { Controller, Delete, Param, ParseUUIDPipe, UseGuards } from "@nestjs/common";

import { GetUserId } from "@/src/contexts/auth/decorators/GetUserId.decorator";
import { JwtGuard } from "@/src/contexts/auth/guards/auth.guard";

import { UserBlocksService } from "../../services/user-blocks.service";
import { V1_BLOCKS } from "../route.constants";

@Controller(V1_BLOCKS)
@UseGuards(JwtGuard)
export class DeleteUserBlockController {
  constructor(private readonly userBlocksService: UserBlocksService) {}

  @Delete(":blocked_profile_id")
  async run(
    @GetUserId() blocker_profile_id: string,
    @Param("blocked_profile_id", new ParseUUIDPipe({ version: "4" }))
    blocked_profile_id: string,
  ): Promise<{ message: string; data: null }> {
    await this.userBlocksService.remove(blocker_profile_id, blocked_profile_id);
    return {
      message: "Usuario desbloqueado correctamente",
      data: null,
    };
  }
}
