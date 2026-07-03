import { describe, it, expect, vi } from "vitest";
import { createMock, Mock } from "@/tests/utils/mock";
import { RecordVehicleViewController } from "@/contexts/vehicles/infrastructure/http-api/v1/record-vehicle-view/record-vehicle-view.controller";
import { RecordVehicleViewUseCase } from "@/contexts/vehicles/application/view-use-cases/record-vehicle-view-use-case/record-vehicle-view.use-case";

vi.mock("@/contexts/shared/token_management/hash_token", () => ({
  hashToken: vi.fn((ip: string) => `hashed-${ip}`),
}));

vi.mock("@/contexts/auth/utils/normalize-user-agent", () => ({
  normalizeUserAgent: vi.fn((ua: string | undefined) => ua?.trim() ?? null),
}));

describe("RecordVehicleViewController", () => {
  let controller: RecordVehicleViewController;
  let useCase: Mock<RecordVehicleViewUseCase>;

  const params = { vehicle_id: "vehicle-123" };
  const body = { user_id: "user-456", metadata: { source: "web" } };
  const req = {
    ip: "127.0.0.1",
    headers: {
      referer: "https://example.com",
      "user-agent": "Mozilla/5.0",
    },
  } as any;

  beforeEach(() => {
    useCase = createMock<RecordVehicleViewUseCase>();
    controller = new RecordVehicleViewController(useCase);
  });

  it("should call use case with processed request data", async () => {
    const expectedResult = Symbol("result");
    useCase.execute.mockResolvedValue(expectedResult);

    const result = await controller.record(params, body, req);

    expect(useCase.execute).toHaveBeenCalledWith({
      vehicle_id: "vehicle-123",
      user_id: "user-456",
      ip_hash: "hashed-127.0.0.1",
      user_agent: "Mozilla/5.0",
      referer: "https://example.com",
      metadata: { source: "web" },
    });
    expect(result).toBe(expectedResult);
  });

  it("should set user_id to null when body.user_id is not provided", async () => {
    useCase.execute.mockResolvedValue(Symbol("result"));
    const bodyWithoutUser = { metadata: {} };

    await controller.record(params, bodyWithoutUser as any, req);

    expect(useCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: null }),
    );
  });

  it("should set referer to null when no referer header is present", async () => {
    useCase.execute.mockResolvedValue(Symbol("result"));
    const reqWithoutReferer = { ip: "127.0.0.1", headers: {} } as any;

    await controller.record(params, body, reqWithoutReferer);

    expect(useCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({ referer: null }),
    );
  });

  it("should handle empty metadata", async () => {
    useCase.execute.mockResolvedValue(Symbol("result"));
    const bodyWithoutMetadata = { user_id: "user-456" };

    await controller.record(params, bodyWithoutMetadata as any, req);

    expect(useCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({ metadata: {} }),
    );
  });

  it("should propagate error when use case fails", async () => {
    const error = new Error("use case error");
    useCase.execute.mockRejectedValue(error);

    await expect(controller.record(params, body, req)).rejects.toThrow(error);
  });
});
