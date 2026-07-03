import { ConflictException } from "@nestjs/common";

import { createMock, Mock } from "@/tests/utils/mock";
import { AdminCreateProfileController } from "@/contexts/profiles/infrastructure/http-api/v1-admin/create-profile/admin-create-profile.controller";
import { AdminCreateProfileUseCase } from "@/contexts/profiles/application/profile/admin-create-profile-use-case/admin-create-profile.use-case";

describe("AdminCreateProfileController", () => {
  let controller: AdminCreateProfileController;
  let adminCreateProfileUseCase: Mock<AdminCreateProfileUseCase>;

  beforeEach(() => {
    adminCreateProfileUseCase = createMock<AdminCreateProfileUseCase>();
    controller = new AdminCreateProfileController(adminCreateProfileUseCase);
  });

  it("should call use case with dto", () => {
    const dto = { id: "550e8400-e29b-41d4-a716-446655440000", name: "Admin", last_name: "User", role_id: "550e8400-e29b-41d4-a716-446655440001" } as any;
    const expected = { id: dto.id, name: "Admin" } as any;
    adminCreateProfileUseCase.execute.mockReturnValue(expected);

    const result = controller.create(dto);

    expect(adminCreateProfileUseCase.execute).toHaveBeenCalledWith(dto);
    expect(result).toBe(expected);
  });

  it("should throw when use case throws", () => {
    const dto = { id: "550e8400-e29b-41d4-a716-446655440000", name: "Admin", role_id: "550e8400-e29b-41d4-a716-446655440001" } as any;
    adminCreateProfileUseCase.execute.mockImplementation(() => { throw new ConflictException("El perfil ya existe"); });

    expect(() => controller.create(dto)).toThrow(ConflictException);
  });
});
