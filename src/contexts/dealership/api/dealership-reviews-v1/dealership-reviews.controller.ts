import { JwtGuard } from "@/src/contexts/auth/guards/auth.guard";
import { DealershipReviewsService } from "@/src/contexts/dealership/services/dealership-reviews.service";
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

import { V1_DEALERSHIP_REVIEWS } from "../route.constants";
import { CreateDealershipReviewHttpDto } from "./create-dealership-review.http-dto";
import { FindAllDealershipReviewsHttpDto } from "./find-all-dealership-reviews.http-dto";

@Controller(V1_DEALERSHIP_REVIEWS)
export class DealershipReviewsController {
  constructor(
    private readonly dealership_reviews_service: DealershipReviewsService,
  ) {}

  @Post()
  @UseGuards(JwtGuard)
  create(@Body() body: CreateDealershipReviewHttpDto, @Req() req: Request) {
    const user = req.user;
    if (!user) {
      throw new UnauthorizedException("Usuario no autenticado");
    }
    return this.dealership_reviews_service.create({
      rating: body.rating,
      comment: body.comment,
      dealership_id: body.dealership_id,
      profile_id: user.id,
    });
  }

  @Get()
  find_all(@Query() query: FindAllDealershipReviewsHttpDto) {
    return this.dealership_reviews_service.findAll({
      dealership_id: query.dealership_id,
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
