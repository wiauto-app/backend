import { createMock, Mock } from "@/tests/utils/mock";
import { RecordVehicleContactClickController } from "@/contexts/vehicles/infrastructure/http-api/v1/contact-clicks/record-vehicle-contact-click.controller";
import { RecordVehicleContactClickUseCase } from "@/contexts/vehicles/application/contact-click-use-cases/record-vehicle-contact-click.use-case";

describe("RecordVehicleContactClickController", () => {
  let controller: RecordVehicleContactClickController;
  let useCase: Mock<RecordVehicleContactClickUseCase>;

  const params = { vehicle_id: "vehicle-123" };
  const body = { type: "phone" };

  beforeEach(() => {
    useCase = createMock<RecordVehicleContactClickUseCase>();
    controller = new RecordVehicleContactClickController(useCase);
  });

  it("should call use case with params, body, and profile_id", async () => {
    const expectedResult = Symbol("result");
    useCase.execute.mockResolvedValue(expectedResult);

    const result = await controller.record(params, body, "profile-456");

    expect(useCase.execute).toHaveBeenCalledWith({
      vehicle_id: "vehicle-123",
      type: "phone",
      profile_id: "profile-456",
    });
    expect(result).toBe(expectedResult);
  });

  it("should call use case with undefined profile_id when not provided", async () => {
    useCase.execute.mockResolvedValue(Symbol("result"));

    await controller.record(params, body, undefined);

    expect(useCase.execute).toHaveBeenCalledWith({
      vehicle_id: "vehicle-123",
      type: "phone",
      profile_id: undefined,
    });
  });

  it("should propagate error when use case fails", async () => {
    const error = new Error("use case error");
    useCase.execute.mockRejectedValue(error);

    await expect(controller.record(params, body, "profile-456")).rejects.toThrow(error);
  });
});
