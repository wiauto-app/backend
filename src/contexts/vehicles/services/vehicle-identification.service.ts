import { BadRequestException } from "@nestjs/common";

import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { TransmissionType } from "@/src/contexts/vehicles/types/vehicle";

import {
  ApiVehiculoClient,
  ApiVehicleData,
  ApiVehicleResponse,
} from "../clients/apivehiculo.client";
import { CatalogReverseMatchService } from "./catalog-reverse-match.service";

export interface LookupVehicleIdentificationDto {
  plate?: string;
  vin?: string;
  country?: string;
}

export interface VehicleIdentificationSource {
  plate: string | null;
  vin: string | null;
  brand: string | null;
  model: string | null;
  version: string | null;
  year: number | null;
  fuel_type: string | null;
  power_hp: number | null;
  displacement_cc: number | null;
  gearbox_type: string | null;
  transmission_type_label: string | null;
}

export interface VehicleIdentificationFormValues {
  license_plate?: string;
  vin_code?: string;
  catalog_make_id?: number;
  catalog_model_id?: number;
  catalog_year_id?: number;
  version_id?: number;
  catalog_fuel_type_id?: number;
  power?: number;
  displacement?: number;
  transmission_type?: TransmissionType;
  traction_id?: string;
}

export interface VehicleIdentificationMatch {
  make_matched: boolean;
  model_matched: boolean;
  year_matched: boolean;
  version_matched: boolean;
}

export interface LookupVehicleIdentificationResult {
  source: VehicleIdentificationSource;
  form_values: VehicleIdentificationFormValues;
  match: VehicleIdentificationMatch;
}

export interface VehicleIdentificationAvailabilityResult {
  available: boolean;
  remaining_requests: number;
  total_requests: number;
}

@Injectable()
export class VehicleIdentificationService {
  constructor(
    private readonly catalog_reverse_match: CatalogReverseMatchService,
    private readonly api_vehiculo_client: ApiVehiculoClient,
  ) {}

  async getAvailability(): Promise<VehicleIdentificationAvailabilityResult> {
    const subscription = await this.api_vehiculo_client.getSubscriptionMe();
    const remaining_requests = Number(subscription?.remainingRequests) || 0;
    const total_requests = Number(subscription?.totalRequests) || 0;

    return {
      available: remaining_requests > 0,
      remaining_requests,
      total_requests,
    };
  }

  async lookup(
    dto: LookupVehicleIdentificationDto,
  ): Promise<ApiVehicleResponse> {
    const plate =
      typeof dto.plate === "string" ? dto.plate.trim() : undefined;
    const vin = typeof dto.vin === "string" ? dto.vin.trim() : undefined;
    const has_plate = Boolean(plate);
    const has_vin = Boolean(vin);

    if ((has_plate && has_vin) || (!has_plate && !has_vin)) {
      throw new BadRequestException(
        "Debes enviar exactamente uno de plate o vin",
      );
    }

    // const api_data = await this.api_vehiculo_client.lookup({
    //   plate: has_plate ? plate : undefined,
    //   vin: has_vin ? vin : undefined,
    //   country: dto.country?.trim() ?? "ES",
    // });
    const api_data = {
      "error": null,
      "plate": "1941GFX",
      "country": "ES",
      "brand": "SEAT",
      "model": "LEON",
      "modelEn": "LEON",
      "version": "1.9 TDI",
      "modelStartDate": "2005-07",
      "modelEndDate": "2010-12",
      "firstRegistrationDate": "2008-06-30",
      "firstRegistrationDateEs": "30/06/2008",
      "co2": "",
      "fuelCode": 2,
      "fuelType": "Diesel",
      "vehicleTypeCode": 1,
      "vehicleType": "Passenger Car",
      "fiscalPower": "13",
      "bodyTypeCode": 25,
      "bodyType": "Hatchback (3 or 5 doors)",
      "transmissionTypeCode": "1",
      "transmissionType": "FWD",
      "engineCapacityLiters": "1.9",
      "fuelSystemCode": "11",
      "fuelSystem": "Direct Injection",
      "valves": "2",
      "powerKW": "77",
      "powerHP": "105",
      "vin": "VSSZZZ1PZ8R120603",
      "variant": "ZZZ1PZ",
      "gearboxType": "Manual",
      "gearboxCode": "",
      "passengerCount": "",
      "doorCount": "0",
      "weight": "",
      "grossVehicleWeight": "",
      "displacementCcm": "1896 CM3",
      "cylinders": "4",
      "serialNumber": "8R120603",
      "brandLogo": "https://api.apivehiculo.com/assets/brands/brand-104.png",
      "modelPhoto": "https://api.apivehiculo.com/assets/vehicles/vehicle-18769.jpg",
      "kType": "18769",
      "tecdocManufacturerId": "104",
      "tecdocModelId": "5431",
      "tecdocCarId": "18769",
      "tecdocCompatibleVehicles": "",
      "engineCode": "BKC,BXE,BLS",
      "platformCodes": "1P1",
      "tires": [
        {
          "name": "225/40 R 18",
          "width": 225,
          "height": 40,
          "diameter": 18,
          "loadIndex": 91,
          "speedIndex": "Y"
        },
        {
          "name": "225/45 R 17",
          "width": 225,
          "height": 45,
          "diameter": 17,
          "loadIndex": 91,
          "speedIndex": "W"
        },
        {
          "name": "225/50 R 17",
          "width": 225,
          "height": 50,
          "diameter": 17,
          "loadIndex": 94,
          "speedIndex": "W"
        },
        {
          "name": "215/50 R 17",
          "width": 215,
          "height": 50,
          "diameter": 17,
          "loadIndex": 94,
          "speedIndex": "W"
        },
        {
          "name": "205/55 R 16",
          "width": 205,
          "height": 55,
          "diameter": 16,
          "loadIndex": 91,
          "speedIndex": "V"
        },
        {
          "name": "205/60 R 16",
          "width": 205,
          "height": 60,
          "diameter": 16,
          "loadIndex": 92,
          "speedIndex": "V"
        }
      ]
    } as ApiVehicleData;


    const matched = await this.catalog_reverse_match.execute(api_data);
    return matched;
  }
}
