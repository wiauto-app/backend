import { NotFoundException } from "@nestjs/common";

import { createMock, Mock } from "@/tests/utils/mock";
import { AdminUpdateProfileController } from "@/contexts/profiles/infrastructure/http-api/v1-admin/admin-update-profile/admin-update-profile.controller";
import { AdminUpdateProfileUseCase } from "@/contexts/profiles/application/profile/admin-update-profile-use-case/admin-update-profile.use-case";

describe("AdminUpdateProfileController", () => {
  let controller: AdminUpdateProfileController;
  let adminUpdateProfileUseCase: Mock<AdminUpdateProfileUseCase>;

  beforeEach(() => {
    adminUpdateProfileUseCase = createMock<AdminUpdateProfileUseCase>();
    controller = new AdminUpdateProfileController(adminUpdateProfileUseCase);
  });

  it("should call use case with dto", () => {
    const dto = { id: "550e8400-e29b-41d4-a716-446655440000", name: "Updated" } as any;
    const expected = { id: dto.id, name: "Updated" } as any;
    adminUpdateProfileUseCase.execute.mockReturnValue(expected);

    const result = controller.update(dto);

    expect(adminUpdateProfileUseCase.execute).toHaveBeenCalledWith(dto);
    expect(result).toBe(expected);
  });

  it("should throw when use case throws", () => {
    const dto = { id: "550e8400-e29b-41d4-a716-446655440000", name: "Updated" } as any;
    adminUpdateProfileUseCase.execute.mockImplementation(() => { throw new NotFoundException("Perfil no encontrado"); });

    expect(() => controller.update(dto)).toThrow(NotFoundException);
  });
});
