import { PaginationDto } from "@/src/contexts/shared/dto/pagination.dto";


export class FindAllVehiclesUseCaseDto extends PaginationDto {
  
  //marca y modelo
  make_slug:string;
  model_slug:string;

  //price filters
  since_price:number;
  until_price:number;

  //mileage filters
  since_mileage:number;
  until_mileage:number;

  //year filters
  since_year:number;
  until_year:number;
  
  //features filters
  features_slugs:string[];

  //location filters
  lat:number;
  lng:number;
  radius:number;

  //online services filters
  service_slugs:string[];

  //publisher filters
  publisher_type:string;

  //seller featured filters
  is_seller_featured:boolean;

  //warranty filters
  warranty_slugs:string[];

  //color filters
  color_slugs:string[];
}