import { BadRequestException } from "@nestjs/common";

import { createMock, Mock } from "@/tests/utils/mock";
import { UpdateMyProfileController } from "@/contexts/profiles/infrastructure/http-api/auth-me/update-my-profile/update-my-profile.controller";
import { UpdateMyProfileUseCase } from "@/contexts/profiles/application/profile/update-my-profile-use-case/update-my-profile.use-case";

describe("UpdateMyProfileController", () => {
  let controller: UpdateMyProfileController;
  let updateMyProfileUseCase: Mock<UpdateMyProfileUseCase>;

  const userId = "550e8400-e29b-41d4-a716-446655440000";

  beforeEach(() => {
    updateMyProfileUseCase = createMock<UpdateMyProfileUseCase>();
    controller = new UpdateMyProfileController(updateMyProfileUseCase);
  });

  it("should call use case with user_id and dto", () => {
    const dto = { name: "John", last_name: "Doe" } as any;
    const expected = { user_id: userId, name: "John", last_name: "Doe" } as any;
    updateMyProfileUseCase.execute.mockReturnValue(expected);

    const result = controller.updateMyProfile(userId, dto);

    expect(updateMyProfileUseCase.execute).toHaveBeenCalledWith({ user_id: userId, ...dto });
    expect(result).toBe(expected);
  });

  it("should work with partial dto (only name)", () => {
    const dto = { name: "John" } as any;
    const expected = { user_id: userId, name: "John" } as any;
    updateMyProfileUseCase.execute.mockReturnValue(expected);

    const result = controller.updateMyProfile(userId, dto);

    expect(updateMyProfileUseCase.execute).toHaveBeenCalledWith({ user_id: userId, name: "John" });
    expect(result).toBe(expected);
  });

  it("should throw when use case throws", () => {
    const dto = { name: "John" } as any;
    updateMyProfileUseCase.execute.mockImplementation(() => { throw new BadRequestException("Datos inválidos"); });

    expect(() => controller.updateMyProfile(userId, dto)).toThrow(BadRequestException);
  });
});
