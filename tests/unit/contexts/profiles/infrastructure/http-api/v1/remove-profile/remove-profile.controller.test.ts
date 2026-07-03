import { NotFoundException } from "@nestjs/common";

import { createMock, Mock } from "@/tests/utils/mock";
import { RemoveProfileController } from "@/contexts/profiles/infrastructure/http-api/v1/remove-profile/remove-profile.controller";
import { RemoveProfileUseCase } from "@/contexts/profiles/application/profile/remove-profile-use-case/remove-profile.use-case";

describe("RemoveProfileController", () => {
  let controller: RemoveProfileController;
  let removeProfileUseCase: Mock<RemoveProfileUseCase>;

  const id = "550e8400-e29b-41d4-a716-446655440000";

  beforeEach(() => {
    removeProfileUseCase = createMock<RemoveProfileUseCase>();
    controller = new RemoveProfileController(removeProfileUseCase);
  });

  it("should call use case with id", async () => {
    removeProfileUseCase.execute.mockResolvedValue(undefined);

    await controller.remove(id);

    expect(removeProfileUseCase.execute).toHaveBeenCalledWith({ id });
  });

  it("should throw when use case throws", async () => {
    removeProfileUseCase.execute.mockRejectedValue(new NotFoundException("Perfil no encontrado"));

    await expect(controller.remove(id)).rejects.toThrow(NotFoundException);
  });
});
