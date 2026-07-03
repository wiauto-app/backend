import { createMock, Mock } from "@/tests/utils/mock";
import { FindAllProfilesController } from "@/contexts/profiles/infrastructure/http-api/v1/find-all-profiles/find-all-profiles.controller";
import { FindAllProfilesUseCase } from "@/contexts/profiles/application/profile/find-all-profiles-use-case/find-all-profiles.use-case";

describe("FindAllProfilesController", () => {
  let controller: FindAllProfilesController;
  let findAllProfilesUseCase: Mock<FindAllProfilesUseCase>;

  beforeEach(() => {
    findAllProfilesUseCase = createMock<FindAllProfilesUseCase>();
    controller = new FindAllProfilesController(findAllProfilesUseCase);
  });

  it("should call use case with query dto", () => {
    const query = { page: 1, limit: 20, name: "John" } as any;
    const expected = { data: [], total: 0 } as any;
    findAllProfilesUseCase.execute.mockReturnValue(expected);

    const result = controller.findAll(query);

    expect(findAllProfilesUseCase.execute).toHaveBeenCalledWith(query);
    expect(result).toBe(expected);
  });

  it("should return empty paginated result when no profiles match", () => {
    const query = { page: 1, limit: 20 } as any;
    findAllProfilesUseCase.execute.mockReturnValue({ data: [], total: 0, page: 1, limit: 20 } as any);

    const result = controller.findAll(query);

    expect(result.data).toEqual([]);
    expect(result.total).toBe(0);
  });

  it("should work without optional filters", () => {
    const query = { page: 1, limit: 20 } as any;
    findAllProfilesUseCase.execute.mockReturnValue({ data: [], total: 0 } as any);

    const result = controller.findAll(query);

    expect(findAllProfilesUseCase.execute).toHaveBeenCalledWith(query);
    expect(result).toBeDefined();
  });
});
