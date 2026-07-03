import { NotFoundException } from "@nestjs/common";

import { createMock, Mock } from "@/tests/utils/mock";
import { FindOneProfileController } from "@/contexts/profiles/infrastructure/http-api/v1/find-one-profile/find-one-profile.controller";
import { FindOneProfileUseCase } from "@/contexts/profiles/application/profile/find-one-profile-use-case/find-one-profile.use-case";

describe("FindOneProfileController", () => {
  let controller: FindOneProfileController;
  let findOneProfileUseCase: Mock<FindOneProfileUseCase>;

  const id = "550e8400-e29b-41d4-a716-446655440000";

  beforeEach(() => {
    findOneProfileUseCase = createMock<FindOneProfileUseCase>();
    controller = new FindOneProfileController(findOneProfileUseCase);
  });

  it("should call use case with id", () => {
    const expected = { id, name: "John" } as any;
    findOneProfileUseCase.execute.mockReturnValue(expected);

    const result = controller.findOne(id);

    expect(findOneProfileUseCase.execute).toHaveBeenCalledWith({ id });
    expect(result).toBe(expected);
  });

  it("should throw when use case throws", () => {
    findOneProfileUseCase.execute.mockImplementation(() => { throw new NotFoundException("Perfil no encontrado"); });

    expect(() => controller.findOne(id)).toThrow(NotFoundException);
  });
});
