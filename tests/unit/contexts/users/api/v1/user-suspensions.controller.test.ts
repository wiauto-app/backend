import { BadRequestException, UnauthorizedException } from "@nestjs/common";

import { createMock, Mock } from "@/tests/utils/mock";
import { UserSuspensionsController } from "@/contexts/users/api/v1/user-suspensions.controller";
import { SuspensionService } from "@/contexts/users/services/suspension.service";

describe("UserSuspensionsController", () => {
  let controller: UserSuspensionsController;
  let suspensionService: Mock<SuspensionService>;

  beforeEach(() => {
    suspensionService = createMock<SuspensionService>();
    controller = new UserSuspensionsController(suspensionService);
  });

  describe("list_duration_types", () => {
    it("should call suspension_service.list_active_duration_types", () => {
      const expected = [{ id: "type-1", key: "temporary", label: "Temporal" }] as any;
      suspensionService.list_active_duration_types.mockReturnValue(expected);

      const result = controller.list_duration_types();

      expect(suspensionService.list_active_duration_types).toHaveBeenCalled();
      expect(result).toBe(expected);
    });

    it("should return empty array when no duration types exist", () => {
      suspensionService.list_active_duration_types.mockReturnValue([]);

      const result = controller.list_duration_types();

      expect(result).toEqual([]);
    });
  });

  describe("suspend", () => {
    it("should call suspension_service.suspend_user with body and actor_id", async () => {
      const body = {
        target_user_id: "550e8400-e29b-41d4-a716-446655440001",
        suspension_reason: "Violación de términos",
        suspension_duration_type_id: "550e8400-e29b-41d4-a716-446655440002",
      } as any;
      const request = { user: { id: "actor-1" } } as any;
      suspensionService.suspend_user.mockResolvedValue(undefined);

      await controller.suspend(body, request);

      expect(suspensionService.suspend_user).toHaveBeenCalledWith(body, "actor-1");
    });

    it("should throw UnauthorizedException when user is not authenticated", async () => {
      const body = {} as any;
      const request = {} as any;

      await expect(controller.suspend(body, request)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(suspensionService.suspend_user).not.toHaveBeenCalled();
    });

    it("should throw when suspension_service.suspend_user throws", async () => {
      const body = {
        target_user_id: "550e8400-e29b-41d4-a716-446655440001",
        suspension_reason: "Violación de términos",
        suspension_duration_type_id: "550e8400-e29b-41d4-a716-446655440002",
      } as any;
      const request = { user: { id: "actor-1" } } as any;
      suspensionService.suspend_user.mockRejectedValue(new BadRequestException("Usuario ya suspendido"));

      await expect(controller.suspend(body, request)).rejects.toThrow(BadRequestException);
    });
  });

  describe("unsuspend", () => {
    it("should call suspension_service.unsuspend_user with body", async () => {
      const body = { target_user_id: "550e8400-e29b-41d4-a716-446655440001" } as any;
      suspensionService.unsuspend_user.mockResolvedValue(undefined);

      await controller.unsuspend(body);

      expect(suspensionService.unsuspend_user).toHaveBeenCalledWith(body);
    });

    it("should throw when suspension_service.unsuspend_user throws", async () => {
      const body = { target_user_id: "550e8400-e29b-41d4-a716-446655440001" } as any;
      suspensionService.unsuspend_user.mockRejectedValue(new BadRequestException("Usuario no suspendido"));

      await expect(controller.unsuspend(body)).rejects.toThrow(BadRequestException);
    });
  });
});
