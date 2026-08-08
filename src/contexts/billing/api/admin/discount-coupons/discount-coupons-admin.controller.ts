import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from "@nestjs/common";

import { AuthAdmin } from "@/src/contexts/auth/decorators/auth-admin.decorator";
import { PaginationHttpDto } from "@/src/contexts/shared/dto/pagination.http-dto";

import { DiscountCouponsService } from "../../../services/discount-coupons.service";
import { V1_BILLING_COUPONS } from "../../route.constants";
import { CreateDiscountCouponHttpDto } from "./create-discount-coupon.http-dto";
import { UpdateDiscountCouponHttpDto } from "./update-discount-coupon.http-dto";

@AuthAdmin()
@Controller(V1_BILLING_COUPONS)
export class DiscountCouponsAdminController {
  constructor(
    private readonly discount_coupons_service: DiscountCouponsService,
  ) {}

  @Post()
  create(@Body() body: CreateDiscountCouponHttpDto) {
    return this.discount_coupons_service.create(body);
  }

  @Get()
  findAll(@Query() query: PaginationHttpDto & { search?: string }) {
    return this.discount_coupons_service.findAll({
      page: query.page,
      limit: query.limit,
      search: query.search,
    });
  }

  @Get(":id")
  findOne(@Param("id", ParseUUIDPipe) id: string) {
    return this.discount_coupons_service.findOne(id);
  }

  @Patch(":id")
  update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() body: UpdateDiscountCouponHttpDto,
  ) {
    return this.discount_coupons_service.update(id, body);
  }

  @Delete(":id")
  remove(@Param("id", ParseUUIDPipe) id: string) {
    return this.discount_coupons_service.remove(id);
  }
}
