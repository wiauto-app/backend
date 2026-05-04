import { PaginationDto } from "@/src/contexts/shared/application/dtos/pagination.dto";
import { PublisherType, TransmissionType } from "../../../domain/entities/vehicle";
import { PickType } from "@nestjs/mapped-types";


export class FindAllVehiclesDto extends PickType(PaginationDto, [
  "page",
  "limit",
  "query",
  "order_by",
  "order_direction",
]) {

  //type filters
  type_slug: string;

  //marca y modelo
  make_slug: string;
  model_slug: string;

  //price filters
  since_price: number;
  until_price: number;


  //offer filters
  price_offer: boolean;

  //online services filters
  service_slugs: string[];

  //location filters (PostGIS: polígonos por slug + opcional radio en metros)
  provinces_slugs?: string[];
  comunities_slugs?: string[];
  municipalities_slugs?: string[];
  lat?: number;
  lng?: number;
  radius?: number;

  //publisher filters
  publisher_types: PublisherType[];

  //seller featured filters
  is_seller_featured: boolean;

  //warranty filters
  warranty_slugs: string[];

  //year filters
  since_year: number;
  until_year: number;

  //mileage filters
  since_mileage: number;
  until_mileage: number;


  //motor filters
  transmission_types: TransmissionType[];
  fuel_type_slugs: string[];
  traction_slugs: string[];

  power_since: number;
  power_until: number;
  displacement_since: number;
  displacement_until: number;


  //dgt label filters
  dgt_label_ids: string[];

  //electric filters
  autonomy_since: number;
  battery_capacity_since: number;
  battery_capacity_until: number;
  time_to_charge: number;


  //features filters
  features_slugs: string[];


  //color filters
  color_slugs: string[];


  //cuota filters
  cuota_slugs: string[];


}

/** Alias usado por el caso de uso */
export type FindAllVehiclesUseCaseDto = FindAllVehiclesDto;