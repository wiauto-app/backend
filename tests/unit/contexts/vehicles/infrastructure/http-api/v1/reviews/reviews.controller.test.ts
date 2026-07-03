import { createMock, Mock } from "@/tests/utils/mock";
import { ReviewsController } from "@/contexts/vehicles/infrastructure/http-api/v1/reviews/reviews.controller";
import { CreateReviewsUseCase } from "@/contexts/vehicles/application/reviews-use-cases/create-review-use-cases/create-reviews.use-case";
import { FindAllReviewsUseCase } from "@/contexts/vehicles/application/reviews-use-cases/find-all-reviews-use-cases/find-all-reviews.use-case";

describe("ReviewsController", () => {
  let controller: ReviewsController;
  let createReviewsUseCase: Mock<CreateReviewsUseCase>;
  let findAllReviewsUseCase: Mock<FindAllReviewsUseCase>;

  beforeEach(() => {
    createReviewsUseCase = createMock<CreateReviewsUseCase>();
    findAllReviewsUseCase = createMock<FindAllReviewsUseCase>();
    controller = new ReviewsController(createReviewsUseCase, findAllReviewsUseCase);
  });

  describe("create", () => {
    const body = { rating: 5, comment: "Great vehicle!", vehicle_id: "vehicle-123" };
    const req = { user: { id: "profile-456" } } as any;

    it("should call create use case with body and authenticated user", async () => {
      const expectedResult = Symbol("result");
      createReviewsUseCase.execute.mockResolvedValue(expectedResult);

      const result = await controller.create(body, req);

      expect(createReviewsUseCase.execute).toHaveBeenCalledWith({
        rating: 5,
        comment: "Great vehicle!",
        vehicle_id: "vehicle-123",
        profile_id: "profile-456",
      });
      expect(result).toBe(expectedResult);
    });

    it("should throw UnauthorizedException when user is not authenticated", async () => {
      const reqWithoutUser = {} as any;

      expect(() => controller.create(body, reqWithoutUser)).toThrow();
      expect(createReviewsUseCase.execute).not.toHaveBeenCalled();
    });

    it("should propagate error when create use case fails", async () => {
      const error = new Error("use case error");
      createReviewsUseCase.execute.mockRejectedValue(error);

      await expect(controller.create(body, req)).rejects.toThrow(error);
    });
  });

  describe("find_all", () => {
    it("should call find all use case with mapped query", async () => {
      const query = {
        vehicle_id: "vehicle-123",
        profile_id: "profile-456",
        page: 1,
        limit: 20,
        created_since: "2024-01-01",
        created_until: "2024-12-31",
        query: "great",
        order_by: "created_at",
        order_direction: "DESC" as const,
      };
      const expectedResult = { data: [], total: 0 };
      findAllReviewsUseCase.execute.mockResolvedValue(expectedResult);

      const result = await controller.find_all(query);

      expect(findAllReviewsUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          vehicle_id: "vehicle-123",
          profile_id: "profile-456",
          page: 1,
          limit: 20,
          created_since: new Date("2024-01-01"),
          created_until: new Date("2024-12-31"),
          query: "great",
          order_by: "created_at",
          order_direction: "DESC",
        }),
      );
      expect(result).toBe(expectedResult);
    });

    it("should handle empty query with undefined fields", async () => {
      findAllReviewsUseCase.execute.mockResolvedValue({ data: [], total: 0 });

      const result = await controller.find_all({});

      expect(findAllReviewsUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          vehicle_id: undefined,
          profile_id: undefined,
          created_since: undefined,
          created_until: undefined,
          page: undefined,
          limit: undefined,
          query: undefined,
          order_by: undefined,
          order_direction: undefined,
        }),
      );
      expect(result).toEqual({ data: [], total: 0 });
    });

    it("should propagate error when find all use case fails", async () => {
      const error = new Error("use case error");
      findAllReviewsUseCase.execute.mockRejectedValue(error);

      await expect(controller.find_all({})).rejects.toThrow(error);
    });
  });
});
