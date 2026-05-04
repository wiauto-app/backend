import { JwtGuard } from "@/src/contexts/auth/guards/auth.guard";
import { CreateReviewsUseCase } from "@/src/contexts/vehicles/application/reviews-use-cases/create-review-use-cases/create-reviews.use-case";
import { FindAllReviewsDto } from "@/src/contexts/vehicles/application/reviews-use-cases/find-all-reviews-use-cases/find-all-reviews.dto";
import { FindAllReviewsUseCase } from "@/src/contexts/vehicles/application/reviews-use-cases/find-all-reviews-use-cases/find-all-reviews.use-case";
import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
} from "@nestjs/common";
import { Request } from "express";

import { V1_REVIEWS } from "../../route.constants";
import { CreateReviewHttpDto } from "./create-review.http-dto";
import { FindAllReviewsHttpDto } from "./find-all-reviews.http-dto";

@Controller(V1_REVIEWS)
export class ReviewsController {
  constructor(
    private readonly create_reviews_use_case: CreateReviewsUseCase,
    private readonly find_all_reviews_use_case: FindAllReviewsUseCase,
  ) {}

  @Post()
  @UseGuards(JwtGuard)
  create(@Body() body: CreateReviewHttpDto, @Req() req: Request) {
    const user = req.user;
    if (!user) {
      throw new UnauthorizedException("Usuario no autenticado");
    }
    return this.create_reviews_use_case.execute({
      rating: body.rating,
      comment: body.comment,
      vehicle_id: body.vehicle_id,
      profile_id: user.id,
    });
  }

  @Get()
  find_all(@Query() query: FindAllReviewsHttpDto) {
    const dto = Object.assign(new FindAllReviewsDto(), {
      vehicle_id: query.vehicle_id,
      profile_id: query.profile_id,
      created_since: query.created_since
        ? new Date(query.created_since)
        : undefined,
      created_until: query.created_until
        ? new Date(query.created_until)
        : undefined,
      page: query.page,
      limit: query.limit,
      query: query.query,
      order_by: query.order_by,
      order_direction: query.order_direction,
    });
    return this.find_all_reviews_use_case.execute(dto);
  }
}
