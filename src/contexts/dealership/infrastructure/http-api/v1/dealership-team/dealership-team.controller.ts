import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
} from "@nestjs/common";

import { GetUser } from "@/src/contexts/auth/decorators/GetUser.decorator";
import { FindDealershipTeamUseCase } from "@/src/contexts/dealership/application/dealership-members/find-dealership-team-use-case/find-dealership-team.use-case";
import { LeaveDealershipTeamUseCase } from "@/src/contexts/dealership/application/dealership-members/leave-dealership-team-use-case/leave-dealership-team.use-case";
import { RemoveDealershipMemberUseCase } from "@/src/contexts/dealership/application/dealership-members/remove-dealership-member-use-case/remove-dealership-member.use-case";
import { UpdateDealershipMemberRoleUseCase } from "@/src/contexts/dealership/application/dealership-members/update-dealership-member-role-use-case/update-dealership-member-role.use-case";
import { AuthPermissions } from "@/src/contexts/users/permissions/decorators/authPermission.decorator";
import { User } from "@/src/contexts/users/entities/user.entity";

import { DealershipMemberGuard } from "../../../guards/dealership-member.guard";
import { DealershipMemberSelfGuard } from "../../../guards/dealership-member-self.guard";
import { DealershipTeamManagerGuard } from "../../../guards/dealership-team-manager.guard";
import { V1_DEALERSHIPS } from "../../../route.constants";

import { UpdateDealershipMemberRoleHttpDto } from "./update-dealership-member-role.http-dto";

@Controller(V1_DEALERSHIPS)
export class DealershipTeamController {
  constructor(
    private readonly find_dealership_team_use_case: FindDealershipTeamUseCase,
    private readonly update_dealership_member_role_use_case: UpdateDealershipMemberRoleUseCase,
    private readonly remove_dealership_member_use_case: RemoveDealershipMemberUseCase,
    private readonly leave_dealership_team_use_case: LeaveDealershipTeamUseCase,
  ) {}

  @Get(":id/team")
  @AuthPermissions({ permissions: [], extraGuards: [DealershipMemberGuard] })
  findTeam(@Param("id") dealership_id: string) {
    return this.find_dealership_team_use_case.execute({ dealership_id });
  }

  @Delete(":id/members/me")
  @HttpCode(HttpStatus.NO_CONTENT)
  @AuthPermissions({ permissions: [], extraGuards: [DealershipMemberSelfGuard] })
  leaveTeam(@Param("id") dealership_id: string, @GetUser() user: User) {
    return this.leave_dealership_team_use_case.execute({
      dealership_id,
      profile_id: user.profile.id,
    });
  }

  @Patch(":id/members/:member_id")
  @AuthPermissions({ permissions: [], extraGuards: [DealershipTeamManagerGuard] })
  updateRole(
    @Param("id") dealership_id: string,
    @Param("member_id") member_id: string,
    @Body() body: UpdateDealershipMemberRoleHttpDto,
  ) {
    return this.update_dealership_member_role_use_case.execute({
      dealership_id,
      member_id,
      role: body.role,
    });
  }

  @Delete(":id/members/:member_id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @AuthPermissions({ permissions: [], extraGuards: [DealershipTeamManagerGuard] })
  removeMember(
    @Param("id") dealership_id: string,
    @Param("member_id") member_id: string,
  ) {
    return this.remove_dealership_member_use_case.execute({
      dealership_id,
      member_id,
    });
  }
}
