import { createMock, Mock } from "@/tests/utils/mock";
import { RecordVehicleShareController } from "@/contexts/vehicles/infrastructure/http-api/v1/record-vehicle-share/record-vehicle-share.controller";
import { RecordVehicleShareUseCase } from "@/contexts/vehicles/application/share-use-cases/record-vehicle-share-use-case/record-vehicle-share.use-case";

describe("RecordVehicleShareController", () => {
  let controller: RecordVehicleShareController;
  let useCase: Mock<RecordVehicleShareUseCase>;

  const params = { vehicle_id: "vehicle-123" };
  const body = { user_id: "user-456", platform: "whatsapp", source: "details" };

  beforeEach(() => {
    useCase = createMock<RecordVehicleShareUseCase>();
    controller = new RecordVehicleShareController(useCase);
  });

  it("should call use case with params and body", async () => {
    const expectedResult = Symbol("result");
    useCase.execute.mockResolvedValue(expectedResult);

    const result = await controller.record(params, body);

    expect(useCase.execute).toHaveBeenCalledWith({
      vehicle_id: "vehicle-123",
      user_id: "user-456",
      platform: "whatsapp",
      source: "details",
    });
    expect(result).toBe(expectedResult);
  });

  it("should set user_id to null when not provided", async () => {
    useCase.execute.mockResolvedValue(Symbol("result"));
    const bodyWithoutUser = { platform: "facebook", source: "card" };

    await controller.record(params, bodyWithoutUser as any);

    expect(useCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: null }),
    );
  });

  it("should propagate error when use case fails", async () => {
    const error = new Error("use case error");
    useCase.execute.mockRejectedValue(error);

    await expect(controller.record(params, body)).rejects.toThrow(error);
  });
});
