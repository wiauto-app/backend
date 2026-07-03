import { ConflictException } from "@nestjs/common";

import { createMock, Mock } from "@/tests/utils/mock";
import { CreateProfileController } from "@/contexts/profiles/infrastructure/http-api/v1/create-profile/create-profile.controller";
import { AdminCreateProfileUseCase } from "@/contexts/profiles/application/profile/admin-create-profile-use-case/admin-create-profile.use-case";

describe("CreateProfileController", () => {
  let controller: CreateProfileController;
  let adminCreateProfileUseCase: Mock<AdminCreateProfileUseCase>;

  beforeEach(() => {
    adminCreateProfileUseCase = createMock<AdminCreateProfileUseCase>();
    controller = new CreateProfileController(adminCreateProfileUseCase);
  });

  it("should call use case with dto", () => {
    const dto = { id: "550e8400-e29b-41d4-a716-446655440000", name: "John", last_name: "Doe" } as any;
    const expected = { id: dto.id, name: "John", last_name: "Doe" } as any;
    adminCreateProfileUseCase.execute.mockReturnValue(expected);

    const result = controller.create(dto);

    expect(adminCreateProfileUseCase.execute).toHaveBeenCalledWith(dto);
    expect(result).toBe(expected);
  });

  it("should throw when use case throws", () => {
    const dto = { id: "550e8400-e29b-41d4-a716-446655440000", name: "John" } as any;
    adminCreateProfileUseCase.execute.mockImplementation(() => { throw new ConflictException("El perfil ya existe"); });

    expect(() => controller.create(dto)).toThrow(ConflictException);
  });
});
