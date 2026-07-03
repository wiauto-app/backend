import { createMock, Mock } from "@/tests/utils/mock";
import { FindAllDealershipInvitationsController } from "@/contexts/dealership/infrastructure/http-api/invitations-v1/find-all-dealership-invitations/find-all-dealership-invitations.controller";
import { FindAllDealershipInvitationsUseCase } from "@/contexts/dealership/application/dealership-invitation/find-all-dealership-invitations-use-case/find-all-dealership-invitations.use-case";
import { FindAllDealershipInvitationsHttpDto } from "@/contexts/dealership/infrastructure/http-api/invitations-v1/find-all-dealership-invitations/find-all-dealership-invitations.http-dto";

describe("FindAllDealershipInvitationsController", () => {
  let controller: FindAllDealershipInvitationsController;
  let findAllDealershipInvitationsUseCase: Mock<FindAllDealershipInvitationsUseCase>;

  const query: FindAllDealershipInvitationsHttpDto = {
    dealership_id: "dealership-1",
    page: 1,
    limit: 10,
    order_direction: "ASC",
    skip: 0,
  };
  const expectedResult = [{ id: "invitation-1" }];

  beforeEach(() => {
    findAllDealershipInvitationsUseCase = createMock<FindAllDealershipInvitationsUseCase>();
    controller = new FindAllDealershipInvitationsController(findAllDealershipInvitationsUseCase);
  });

  it("should call use case with query", () => {
    findAllDealershipInvitationsUseCase.execute.mockReturnValue(expectedResult as any);

    const result = controller.run(query);

    expect(findAllDealershipInvitationsUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        dealership_id: "dealership-1",
        status: undefined,
      }),
    );
    expect(result).toBe(expectedResult);
  });

  it("should return empty array when no invitations found", () => {
    findAllDealershipInvitationsUseCase.execute.mockReturnValue([]);

    const result = controller.run(query);

    expect(result).toEqual([]);
  });

  it("should throw when use case throws", () => {
    const error = new Error("Use case error");
    findAllDealershipInvitationsUseCase.execute.mockRejectedValue(error);

    expect(controller.run(query)).rejects.toThrow(error);
  });
});
