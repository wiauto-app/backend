import { createMock, Mock } from "@/tests/utils/mock";
import { DealershipTeamController } from "@/contexts/dealership/infrastructure/http-api/v1/dealership-team/dealership-team.controller";
import { FindDealershipTeamUseCase } from "@/contexts/dealership/application/dealership-members/find-dealership-team-use-case/find-dealership-team.use-case";
import { LeaveDealershipTeamUseCase } from "@/contexts/dealership/application/dealership-members/leave-dealership-team-use-case/leave-dealership-team.use-case";
import { RemoveDealershipMemberUseCase } from "@/contexts/dealership/application/dealership-members/remove-dealership-member-use-case/remove-dealership-member.use-case";
import { UpdateDealershipMemberRoleUseCase } from "@/contexts/dealership/application/dealership-members/update-dealership-member-role-use-case/update-dealership-member-role.use-case";
import { User } from "@/src/contexts/users/entities/user.entity";

describe("DealershipTeamController", () => {
  let controller: DealershipTeamController;
  let findDealershipTeamUseCase: Mock<FindDealershipTeamUseCase>;
  let updateDealershipMemberRoleUseCase: Mock<UpdateDealershipMemberRoleUseCase>;
  let removeDealershipMemberUseCase: Mock<RemoveDealershipMemberUseCase>;
  let leaveDealershipTeamUseCase: Mock<LeaveDealershipTeamUseCase>;

  const dealership_id = "dealership-1";
  const member_id = "member-1";
  const user = { profile: { id: "profile-1" } } as User;
  const roleDto = { role: "admin" as const };

  beforeEach(() => {
    findDealershipTeamUseCase = createMock<FindDealershipTeamUseCase>();
    updateDealershipMemberRoleUseCase = createMock<UpdateDealershipMemberRoleUseCase>();
    removeDealershipMemberUseCase = createMock<RemoveDealershipMemberUseCase>();
    leaveDealershipTeamUseCase = createMock<LeaveDealershipTeamUseCase>();
    controller = new DealershipTeamController(
      findDealershipTeamUseCase,
      updateDealershipMemberRoleUseCase,
      removeDealershipMemberUseCase,
      leaveDealershipTeamUseCase,
    );
  });

  describe("findTeam", () => {
    it("should call use case with dealership id", () => {
      const expected = [{ id: "member-1" }];
      findDealershipTeamUseCase.execute.mockReturnValue(expected as any);

      const result = controller.findTeam(dealership_id);

      expect(findDealershipTeamUseCase.execute).toHaveBeenCalledWith({
        dealership_id,
      });
      expect(result).toBe(expected);
    });

    it("should throw when use case throws", () => {
      const error = new Error("Use case error");
      findDealershipTeamUseCase.execute.mockRejectedValue(error);

      expect(controller.findTeam(dealership_id)).rejects.toThrow(error);
    });
  });

  describe("leaveTeam", () => {
    it("should call use case with dealership id and profile id", async () => {
      leaveDealershipTeamUseCase.execute.mockResolvedValue(undefined);

      const result = await controller.leaveTeam(dealership_id, user);

      expect(leaveDealershipTeamUseCase.execute).toHaveBeenCalledWith({
        dealership_id,
        profile_id: user.profile.id,
      });
      expect(result).toBe(undefined);
    });

    it("should throw when use case throws", () => {
      const error = new Error("Use case error");
      leaveDealershipTeamUseCase.execute.mockRejectedValue(error);

      expect(controller.leaveTeam(dealership_id, user)).rejects.toThrow(error);
    });
  });

  describe("updateRole", () => {
    it("should call use case with dealership id, member id and role", () => {
      const expected = { id: member_id, role: "admin" };
      updateDealershipMemberRoleUseCase.execute.mockReturnValue(expected as any);

      const result = controller.updateRole(dealership_id, member_id, roleDto);

      expect(updateDealershipMemberRoleUseCase.execute).toHaveBeenCalledWith({
        dealership_id,
        member_id,
        role: roleDto.role,
      });
      expect(result).toBe(expected);
    });

    it("should throw when use case throws", () => {
      const error = new Error("Use case error");
      updateDealershipMemberRoleUseCase.execute.mockRejectedValue(error);

      expect(controller.updateRole(dealership_id, member_id, roleDto)).rejects.toThrow(error);
    });
  });

  describe("removeMember", () => {
    it("should call use case with dealership id and member id", async () => {
      removeDealershipMemberUseCase.execute.mockResolvedValue(undefined);

      const result = await controller.removeMember(dealership_id, member_id);

      expect(removeDealershipMemberUseCase.execute).toHaveBeenCalledWith({
        dealership_id,
        member_id,
      });
      expect(result).toBe(undefined);
    });

    it("should throw when use case throws", () => {
      const error = new Error("Use case error");
      removeDealershipMemberUseCase.execute.mockRejectedValue(error);

      expect(controller.removeMember(dealership_id, member_id)).rejects.toThrow(error);
    });
  });
});
