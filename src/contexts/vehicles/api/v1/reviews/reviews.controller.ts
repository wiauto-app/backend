import { JwtGuard } from "@/src/contexts/auth/guards/auth.guard";
import { ReviewsService } from "@/src/contexts/vehicles/services/reviews.service";
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
  constructor(private readonly reviews_service: ReviewsService) {}

  @Post()
  @UseGuards(JwtGuard)
  create(@Body() body: CreateReviewHttpDto, @Req() req: Request) {
    const user = req.user;
    if (!user) {
      throw new UnauthorizedException("Usuario no autenticado");
    }
    return this.reviews_service.create({
      rating: body.rating,
      comment: body.comment,
      vehicle_id: body.vehicle_id,
      profile_id: user.id,
    });
  }

  @Get()
  find_all(@Query() query: FindAllReviewsHttpDto) {
    return this.reviews_service.findAll({
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
  }
}
