import { NotFoundException } from "@nestjs/common";

import { createMock, Mock } from "@/tests/utils/mock";
import { UpdateProfileController } from "@/contexts/profiles/infrastructure/http-api/v1/update-profile/update-profile.controller";
import { UpdateProfileUseCase } from "@/contexts/profiles/application/profile/update-profile-use-case/update-profile.use-case";

describe("UpdateProfileController", () => {
  let controller: UpdateProfileController;
  let updateProfileUseCase: Mock<UpdateProfileUseCase>;

  const id = "550e8400-e29b-41d4-a716-446655440000";

  beforeEach(() => {
    updateProfileUseCase = createMock<UpdateProfileUseCase>();
    controller = new UpdateProfileController(updateProfileUseCase);
  });

  it("should call use case with id and dto", () => {
    const dto = { name: "Updated" } as any;
    const expected = { id, name: "Updated" } as any;
    updateProfileUseCase.execute.mockReturnValue(expected);

    const result = controller.update(id, dto);

    expect(updateProfileUseCase.execute).toHaveBeenCalledWith({ id, ...dto });
    expect(result).toBe(expected);
  });

  it("should throw when use case throws", () => {
    const dto = { name: "Updated" } as any;
    updateProfileUseCase.execute.mockImplementation(() => { throw new NotFoundException("Perfil no encontrado"); });

    expect(() => controller.update(id, dto)).toThrow(NotFoundException);
  });
});
