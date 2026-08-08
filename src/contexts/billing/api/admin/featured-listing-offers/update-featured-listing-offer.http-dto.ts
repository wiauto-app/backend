import { PartialType } from "@nestjs/mapped-types";

import { CreateFeaturedListingOfferHttpDto } from "./create-featured-listing-offer.http-dto";

export class UpdateFeaturedListingOfferHttpDto extends PartialType(
  CreateFeaturedListingOfferHttpDto,
) {}
