import { Controller, Get, UseGuards } from "@nestjs/common";

import { JwtGuard } from "@/src/contexts/auth/guards/auth.guard";

import { FeaturedListingOffersService } from "../../../services/featured-listing-offers.service";
import { V1_BILLING_FEATURED_LISTING_OFFERS_CATALOG } from "../../route.constants";

@Controller(V1_BILLING_FEATURED_LISTING_OFFERS_CATALOG)
@UseGuards(JwtGuard)
export class FindFeaturedListingOffersCatalogController {
  constructor(
    private readonly featured_listing_offers_service: FeaturedListingOffersService,
  ) {}

  @Get()
  run() {
    return this.featured_listing_offers_service.findCatalog();
  }
}
