import { createMock, Mock } from "@/tests/utils/mock";
import { GetOwnerDashboardController } from "@/contexts/vehicles/infrastructure/http-api/v1/get-owner-dashboard/get-owner-dashboard.controller";
import { GetOwnerDashboardUseCase } from "@/contexts/vehicles/application/owner-dashboard/get-owner-dashboard-use-case/get-owner-dashboard.use-case";
import { DEFAULT_OWNER_DASHBOARD_PERIOD } from "@/contexts/vehicles/domain/utils/owner-dashboard-rules";

describe("GetOwnerDashboardController", () => {
  let controller: GetOwnerDashboardController;
  let useCase: Mock<GetOwnerDashboardUseCase>;

  const query = { period: "30d" };
  const req = { user: { id: "profile-123" } } as any;

  beforeEach(() => {
    useCase = createMock<GetOwnerDashboardUseCase>();
    controller = new GetOwnerDashboardController(useCase);
  });

  it("should call use case with profile_id and period from query", async () => {
    const expectedResult = Symbol("result");
    useCase.execute.mockResolvedValue(expectedResult);

    const result = await controller.run(query, req);

    expect(useCase.execute).toHaveBeenCalledWith({
      profile_id: "profile-123",
      period: "30d",
    });
    expect(result).toBe(expectedResult);
  });

  it("should use default period when query period is not provided", async () => {
    useCase.execute.mockResolvedValue(Symbol("result"));

    await controller.run({}, req);

    expect(useCase.execute).toHaveBeenCalledWith({
      profile_id: "profile-123",
      period: DEFAULT_OWNER_DASHBOARD_PERIOD,
    });
  });

  it("should throw UnauthorizedException when req.user is missing", async () => {
    const reqWithoutUser = {} as any;

    expect(() => controller.run(query, reqWithoutUser)).toThrow();
    expect(useCase.execute).not.toHaveBeenCalled();
  });

  it("should propagate error when use case fails", async () => {
    const error = new Error("use case error");
    useCase.execute.mockRejectedValue(error);

    await expect(controller.run(query, req)).rejects.toThrow(error);
  });
});
