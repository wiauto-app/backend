import { z } from "zod";
import {
  PUBLISHER_TYPE,
  TRANSMISSION_TYPE,
} from "@/src/contexts/vehicles/types/vehicle";

export const searchVehiclesInputSchema = z.object({
  type_slug: z.string().optional(),
  makes_slugs: z.array(z.string()).optional(),
  models_slugs: z.array(z.string()).optional(),
  categories_slugs: z.array(z.string()).optional(),
  since_price: z.number().optional(),
  until_price: z.number().optional(),
  price_offer: z.boolean().optional(),
  service_slugs: z.array(z.string()).optional(),
  provinces_slugs: z.array(z.string()).optional(),
  comunities_slugs: z.array(z.string()).optional(),
  municipalities_slugs: z.array(z.string()).optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  radius: z.number().optional(),
  publisher_types: z
    .array(z.enum([PUBLISHER_TYPE.PROFESSIONAL, PUBLISHER_TYPE.PARTICULAR]))
    .optional(),
  is_seller_featured: z.boolean().optional(),
  warranty_slugs: z.array(z.string()).optional(),
  since_year: z.number().optional(),
  until_year: z.number().optional(),
  since_mileage: z.number().optional(),
  until_mileage: z.number().optional(),
  transmission_types: z
    .array(z.enum([TRANSMISSION_TYPE.MANUAL, TRANSMISSION_TYPE.AUTOMATIC]))
    .optional(),
  fuel_type_slugs: z.array(z.string()).optional(),
  traction_slugs: z.array(z.string()).optional(),
  power_since: z.number().optional(),
  power_until: z.number().optional(),
  displacement_since: z.number().optional(),
  displacement_until: z.number().optional(),
  dgt_label_ids: z.array(z.string()).optional(),
  autonomy_since: z.number().optional(),
  battery_capacity_since: z.number().optional(),
  battery_capacity_until: z.number().optional(),
  time_to_charge: z.number().optional(),
  features_slugs: z.array(z.string()).optional(),
  color_slugs: z.array(z.string()).optional(),
  cuota_slugs: z.array(z.string()).optional(),
  exclude_vehicle_ids: z.array(z.string()).optional(),
  dealership_ids: z.array(z.string()).optional(),
});

export type SearchVehiclesInput = z.infer<typeof searchVehiclesInputSchema>;
