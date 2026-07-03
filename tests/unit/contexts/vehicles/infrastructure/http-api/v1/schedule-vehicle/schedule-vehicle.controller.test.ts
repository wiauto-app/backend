import { createMock, Mock } from "@/tests/utils/mock";
import { ScheduleVehicleController } from "@/contexts/vehicles/infrastructure/http-api/v1/schedule-vehicle/schedule-vehicle.controller";
import { ScheduleVehicleUseCase } from "@/contexts/vehicles/application/vehicle/schedule-vehicle-use-case/schedule-vehicle.use-case";

describe("ScheduleVehicleController", () => {
  let controller: ScheduleVehicleController;
  let scheduleVehicleUseCase: Mock<ScheduleVehicleUseCase>;

  const id = "vehicle-1";
  const body = { scheduled_publish_at: new Date("2026-12-31") };
  const expectedResult = { id: "vehicle-1", scheduled_publish_at: body.scheduled_publish_at };

  beforeEach(() => {
    scheduleVehicleUseCase = createMock<ScheduleVehicleUseCase>();
    controller = new ScheduleVehicleController(scheduleVehicleUseCase);
  });

  it("should call use case with vehicle id and scheduled date", () => {
    scheduleVehicleUseCase.execute.mockReturnValue(expectedResult as any);

    const result = controller.run(id, body);

    expect(scheduleVehicleUseCase.execute).toHaveBeenCalledWith({
      vehicle_id: id,
      scheduled_publish_at: body.scheduled_publish_at,
    });
    expect(result).toBe(expectedResult);
  });
});
