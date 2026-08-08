import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  UseGuards,
} from "@nestjs/common";

import { GetUser } from "@/src/contexts/auth/decorators/GetUser.decorator";
import { JwtGuard } from "@/src/contexts/auth/guards/auth.guard";
import { DealershipMembersService } from "@/src/contexts/dealership/services/dealership-members.service";
import { User } from "@/src/contexts/users/entities/user.entity";

import { DealershipMemberGuard } from "../../../guards/dealership-member.guard";
import { DealershipMemberSelfGuard } from "../../../guards/dealership-member-self.guard";
import { DealershipTeamManagerGuard } from "../../../guards/dealership-team-manager.guard";
import { V1_DEALERSHIPS } from "../../route.constants";
import { UpdateDealershipMemberRoleHttpDto } from "./update-dealership-member-role.http-dto";

@Controller(V1_DEALERSHIPS)
export class DealershipTeamController {
  constructor(
    private readonly dealership_members_service: DealershipMembersService,
  ) {}

  @Get(":id/team")
  @UseGuards(JwtGuard, DealershipMemberGuard)
  findTeam(@Param("id") dealership_id: string) {
    return this.dealership_members_service.findTeam(dealership_id);
  }

  @Delete(":id/members/me")
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtGuard, DealershipMemberSelfGuard)
  leaveTeam(@Param("id") dealership_id: string, @GetUser() user: User) {
    return this.dealership_members_service.leaveTeam({
      dealership_id,
      profile_id: user.profile.id,
    });
  }

  @Patch(":id/members/:member_id")
  @UseGuards(JwtGuard, DealershipTeamManagerGuard)
  updateRole(
    @Param("id") dealership_id: string,
    @Param("member_id") member_id: string,
    @Body() body: UpdateDealershipMemberRoleHttpDto,
  ) {
    return this.dealership_members_service.updateRole({
      dealership_id,
      member_id,
      role: body.role,
    });
  }

  @Delete(":id/members/:member_id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtGuard, DealershipTeamManagerGuard)
  removeMember(
    @Param("id") dealership_id: string,
    @Param("member_id") member_id: string,
  ) {
    return this.dealership_members_service.removeMember({
      dealership_id,
      member_id,
    });
  }
}
