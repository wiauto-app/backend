import { createMock, Mock } from "@/tests/utils/mock";
import { CreateLeadController } from "@/contexts/vehicles/infrastructure/http-api/v1/leads/create-lead.controller";
import { CreateLeadUseCase } from "@/contexts/vehicles/application/leads/create-lead-use-case/create-lead.use-case";
import { CreateCallMeLeadController } from "@/contexts/vehicles/infrastructure/http-api/v1/leads/create-call-me-lead.controller";
import { CreateCallMeLeadUseCase } from "@/contexts/vehicles/application/leads/create-call-me-lead-use-case/create-call-me-lead.use-case";

describe("CreateLeadController", () => {
  let controller: CreateLeadController;
  let useCase: Mock<CreateLeadUseCase>;

  const vehicle_id = "550e8400-e29b-41d4-a716-446655440000";
  const body = {
    name: "John Doe",
    email: "john@test.com",
    phone: "123456789",
    phone_code: "+1",
    message: "I'm interested in this vehicle",
  };

  beforeEach(() => {
    useCase = createMock<CreateLeadUseCase>();
    controller = new CreateLeadController(useCase);
  });

  it("should call use case with vehicle_id, body, and buyer_profile_id", async () => {
    const expectedResult = Symbol("result");
    useCase.execute.mockResolvedValue(expectedResult);

    const result = await controller.create(vehicle_id, body, "profile-456");

    expect(useCase.execute).toHaveBeenCalledWith({
      vehicle_id,
      name: body.name,
      email: body.email,
      phone: body.phone,
      phone_code: body.phone_code,
      message: body.message,
      buyer_profile_id: "profile-456",
    });
    expect(result).toBe(expectedResult);
  });

  it("should call use case with undefined buyer_profile_id when not authenticated", async () => {
    useCase.execute.mockResolvedValue(Symbol("result"));

    await controller.create(vehicle_id, body, undefined);

    expect(useCase.execute).toHaveBeenCalledWith({
      vehicle_id,
      name: body.name,
      email: body.email,
      phone: body.phone,
      phone_code: body.phone_code,
      message: body.message,
      buyer_profile_id: undefined,
    });
  });

  it("should propagate error when use case fails", async () => {
    const error = new Error("use case error");
    useCase.execute.mockRejectedValue(error);

    await expect(controller.create(vehicle_id, body, "profile-456")).rejects.toThrow(error);
  });
});

describe("CreateCallMeLeadController", () => {
  let controller: CreateCallMeLeadController;
  let useCase: Mock<CreateCallMeLeadUseCase>;

  const vehicle_id = "550e8400-e29b-41d4-a716-446655440000";
  const body = {
    name: "John Doe",
    phone: "123456789",
    phone_code: "+1",
    callback_scheduled_at: "2025-01-15T10:00:00Z",
  };

  beforeEach(() => {
    useCase = createMock<CreateCallMeLeadUseCase>();
    controller = new CreateCallMeLeadController(useCase);
  });

  it("should call use case with vehicle_id, body, and buyer_profile_id", async () => {
    const expectedResult = Symbol("result");
    useCase.execute.mockResolvedValue(expectedResult);

    const result = await controller.create(vehicle_id, body, "profile-456");

    expect(useCase.execute).toHaveBeenCalledWith({
      vehicle_id,
      name: body.name,
      phone: body.phone,
      phone_code: body.phone_code,
      callback_scheduled_at: body.callback_scheduled_at,
      buyer_profile_id: "profile-456",
    });
    expect(result).toBe(expectedResult);
  });

  it("should call use case with undefined buyer_profile_id when not authenticated", async () => {
    useCase.execute.mockResolvedValue(Symbol("result"));

    await controller.create(vehicle_id, body, undefined);

    expect(useCase.execute).toHaveBeenCalledWith({
      vehicle_id,
      name: body.name,
      phone: body.phone,
      phone_code: body.phone_code,
      callback_scheduled_at: body.callback_scheduled_at,
      buyer_profile_id: undefined,
    });
  });

  it("should propagate error when use case fails", async () => {
    const error = new Error("use case error");
    useCase.execute.mockRejectedValue(error);

    await expect(controller.create(vehicle_id, body, "profile-456")).rejects.toThrow(error);
  });
});
