import { createMock, Mock } from "@/tests/utils/mock";
import { DealershipReviewsController } from "@/contexts/dealership/infrastructure/http-api/dealership-reviews-v1/dealership-reviews.controller";
import { CreateDealershipReviewUseCase } from "@/contexts/dealership/application/dealership-reviews-use-cases/create-dealership-review-use-case/create-dealership-review.use-case";
import { FindAllDealershipReviewsUseCase } from "@/contexts/dealership/application/dealership-reviews-use-cases/find-all-dealership-reviews-use-case/find-all-dealership-reviews.use-case";
import { CreateDealershipReviewHttpDto } from "@/contexts/dealership/infrastructure/http-api/dealership-reviews-v1/create-dealership-review.http-dto";
import { UnauthorizedException } from "@nestjs/common";

describe("DealershipReviewsController", () => {
  let controller: DealershipReviewsController;
  let createDealershipReviewUseCase: Mock<CreateDealershipReviewUseCase>;
  let findAllDealershipReviewsUseCase: Mock<FindAllDealershipReviewsUseCase>;

  beforeEach(() => {
    createDealershipReviewUseCase = createMock<CreateDealershipReviewUseCase>();
    findAllDealershipReviewsUseCase = createMock<FindAllDealershipReviewsUseCase>();
    controller = new DealershipReviewsController(
      createDealershipReviewUseCase,
      findAllDealershipReviewsUseCase,
    );
  });

  describe("create", () => {
    const body: CreateDealershipReviewHttpDto = {
      dealership_id: "dealership-1",
      rating: 5,
      comment: "Great!",
    };
    const user = { id: "profile-1" };
    const req = { user } as any;
    const expectedResult = { id: "review-1" };

    it("should call use case with body and user id", () => {
      createDealershipReviewUseCase.execute.mockReturnValue(expectedResult as any);

      const result = controller.create(body, req);

      expect(createDealershipReviewUseCase.execute).toHaveBeenCalledWith({
        rating: body.rating,
        comment: body.comment,
        dealership_id: body.dealership_id,
        profile_id: user.id,
      });
      expect(result).toBe(expectedResult);
    });

    it("should throw if user is not authenticated", () => {
      const reqWithoutUser = {} as any;

      expect(() => controller.create(body, reqWithoutUser)).toThrow(UnauthorizedException);
      expect(createDealershipReviewUseCase.execute).not.toHaveBeenCalled();
    });
  });

  describe("find_all", () => {
    const query = {
      dealership_id: "dealership-1",
      page: 1,
      limit: 10,
      order_direction: "ASC" as const,
    };
    const expectedResult = [{ id: "review-1" }];

    it("should call use case with query", () => {
      findAllDealershipReviewsUseCase.execute.mockReturnValue(expectedResult as any);

      const result = controller.find_all(query as any);

      expect(findAllDealershipReviewsUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({ dealership_id: "dealership-1" }),
      );
      expect(result).toBe(expectedResult);
    });

    it("should return empty array when no reviews found", () => {
      findAllDealershipReviewsUseCase.execute.mockReturnValue([]);

      const result = controller.find_all(query as any);

      expect(result).toEqual([]);
    });

    it("should throw when use case throws", () => {
      const error = new Error("Use case error");
      findAllDealershipReviewsUseCase.execute.mockRejectedValue(error);

      expect(controller.find_all(query as any)).rejects.toThrow(error);
    });
  });
});
