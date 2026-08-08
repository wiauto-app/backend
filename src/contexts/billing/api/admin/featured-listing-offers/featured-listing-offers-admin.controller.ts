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

import { AuthPermissions } from "@/src/contexts/users/permissions/decorators/authPermission.decorator";
import { PermissionKeys } from "@/src/contexts/users/permissions/lib/available-permission";
import { PaginationHttpDto } from "@/src/contexts/shared/dto/pagination.http-dto";

import { FeaturedListingOffersService } from "../../../services/featured-listing-offers.service";
import { V1_BILLING_FEATURED_LISTING_OFFERS } from "../../route.constants";
import { CreateFeaturedListingOfferHttpDto } from "./create-featured-listing-offer.http-dto";
import { UpdateFeaturedListingOfferHttpDto } from "./update-featured-listing-offer.http-dto";

@AuthPermissions(PermissionKeys.BILLING_MANAGE)
@Controller(V1_BILLING_FEATURED_LISTING_OFFERS)
export class FeaturedListingOffersAdminController {
  constructor(
    private readonly featured_listing_offers_service: FeaturedListingOffersService,
  ) {}

  @Post()
  create(@Body() body: CreateFeaturedListingOfferHttpDto) {
    return this.featured_listing_offers_service.create(body);
  }

  @Get()
  findAll(@Query() query: PaginationHttpDto & { search?: string }) {
    return this.featured_listing_offers_service.findAll({
      page: query.page,
      limit: query.limit,
      search: query.search,
    });
  }

  @Get(":id")
  findOne(@Param("id", ParseUUIDPipe) id: string) {
    return this.featured_listing_offers_service.findOne(id);
  }

  @Patch(":id")
  update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() body: UpdateFeaturedListingOfferHttpDto,
  ) {
    return this.featured_listing_offers_service.update(id, body);
  }

  @Delete(":id")
  remove(@Param("id", ParseUUIDPipe) id: string) {
    return this.featured_listing_offers_service.remove(id);
  }

  @Post(":id/sync-stripe")
  syncStripe(@Param("id", ParseUUIDPipe) id: string) {
    return this.featured_listing_offers_service.syncStripe(id);
  }
}
