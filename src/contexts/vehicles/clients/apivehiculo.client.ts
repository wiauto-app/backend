import {
  BadRequestException,
  Injectable,
  Logger,
} from "@nestjs/common";

import { envs } from "@/src/common/envs";
import { VehicleExternalLookupConfigException } from "@/src/contexts/vehicles/exceptions/vehicle-external-lookup-config.exception";
import { VehicleExternalLookupNotFoundException } from "@/src/contexts/vehicles/exceptions/vehicle-external-lookup-not-found.exception";
import { VehicleExternalLookupRateLimitedException } from "@/src/contexts/vehicles/exceptions/vehicle-external-lookup-rate-limited.exception";
import { TransmissionType } from "../types/vehicle";

export interface VehicleExternalLookupQuery {
  plate?: string;
  vin?: string;
  country?: string;
}

export interface ApiVehicleResponse {
  version_id: number;
  catalog_make_id: number;
  catalog_model_id: number;
  catalog_year_id: number;
  power: number | null;
  displacement: string | number | null;
  traction_id: string;
  transmission_type: TransmissionType;
  vin: string | null;
  license_plate: string | null;
}

export type TRACTION_TYPE_ID = 'FWD' | 'RWD' | 'AWD';

export interface ApiVehicleData {
  error: string | null;
  plate: string;
  country: string;
  brand: string;
  model: string;
  modelEn: string;
  version: string;
  modelStartDate: string;
  modelEndDate: string;
  firstRegistrationDate: string;
  firstRegistrationDateEs: string;
  co2: string;
  fuelCode: number;
  fuelType: string;
  vehicleTypeCode: number;
  vehicleType: string;
  fiscalPower: string;
  bodyTypeCode: number;
  bodyType: string;
  transmissionTypeCode: string;
  transmissionType: string;
  engineCapacityLiters: string;
  fuelSystemCode: string;
  fuelSystem: string;
  valves: string;
  powerKW: string;
  powerHP: string;
  vin: string;
  variant: string;
  gearboxType: string;
  gearboxCode: string;
  passengerCount: string;
  doorCount: string;
  weight: string;
  grossVehicleWeight: string;
  displacementCcm: string;
  cylinders: string;
  serialNumber: string;
  brandLogo: string;
  modelPhoto: string;
  kType: string;
  tecdocManufacturerId: string;
  tecdocModelId: string;
  tecdocCarId: string;
  tecdocCompatibleVehicles: string;
  engineCode: string;
  platformCodes: string;
  tires: Tire[];
}

export interface Tire {
  name: string;
  width: number;
  height: number;
  diameter: number;
  loadIndex: number;
  speedIndex: string;
}


interface ApiVehiculoLookupResponse {
  code?: number;
  message?: string;
  data?: ApiVehicleData;
}

export interface ApiVehiculoSubscriptionMe {
  _id: string;
  userId: string;
  planId: string;
  status: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  requestsUsed: number;
  additionalRequests: number;
  planMonthlyRequests: number;
  totalRequests: number;
  remainingRequests: number;
  stripeSubscriptionId: string | null;
  pendingPlanId: string | null;
  cancelledAt: string | null;
}

@Injectable()
export class ApiVehiculoClient {
  private readonly logger = new Logger(ApiVehiculoClient.name);

  private resolveApiKey(): string {
    const api_key = envs.APIVEHICULO_API_KEY.trim();
    if (!api_key) {
      throw new VehicleExternalLookupConfigException();
    }
    return api_key;
  }

  private buildUrl(path: string): string {
    const base = envs.APIVEHICULO_BASE_URL.replace(/\/$/, "");
    const normalized_path = path.replace(/^\//, "");
    return `${base}/${normalized_path}`;
  }

  async getSubscriptionMe(): Promise<ApiVehiculoSubscriptionMe> {
    const api_key = this.resolveApiKey();
    const url = this.buildUrl("subscriptions/me");

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${api_key}`,
        Accept: "application/json",
      },
    });

    if (response.status === 401 || response.status === 403) {
      this.logger.error(
        `ApiVehiculo subscription auth error status=${response.status}`,
      );
      throw new VehicleExternalLookupConfigException();
    }
    if (!response.ok) {
      this.logger.error(
        `ApiVehiculo subscription unexpected status=${response.status}`,
      );
      throw new VehicleExternalLookupConfigException();
    }

    return (await response.json()) as ApiVehiculoSubscriptionMe;
  }

  async lookup(query: VehicleExternalLookupQuery): Promise<ApiVehicleData> {
    const api_key = this.resolveApiKey();

    const has_plate =
      typeof query.plate === "string" && query.plate.trim().length > 0;
    const has_vin =
      typeof query.vin === "string" && query.vin.trim().length > 0;

    if ((has_plate && has_vin) || (!has_plate && !has_vin)) {
      throw new BadRequestException(
        "Debes enviar exactamente uno de plate o vin",
      );
    }

    const base_url = envs.APIVEHICULO_BASE_URL;
    const url = new URL(base_url);

    if (has_plate) {
      url.searchParams.set("plate", query.plate?.trim() ?? "");
      url.searchParams.set("country", (query.country ?? "ES").trim() || "ES");
    } else {
      url.searchParams.set("vin", query.vin?.trim() ?? "");
      if (query.country?.trim()) {
        url.searchParams.set("country", query.country.trim());
      }
    }

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        Authorization: `Bearer ${api_key}`,
        Accept: "application/json",
      },
    });

    if (response.status === 400) {
      throw new BadRequestException(
        "La consulta de identificación no es válida",
      );
    }
    if (response.status === 401 || response.status === 403) {
      this.logger.error(`ApiVehiculo auth error status=${response.status}`);
      throw new VehicleExternalLookupConfigException();
    }
    if (response.status === 404) {
      throw new VehicleExternalLookupNotFoundException();
    }
    if (response.status === 429) {
      throw new VehicleExternalLookupRateLimitedException();
    }
    if (!response.ok) {
      this.logger.error(`ApiVehiculo unexpected status=${response.status}`);
      throw new VehicleExternalLookupConfigException();
    }

    const payload = await response.json() as ApiVehiculoLookupResponse;
    const data = payload.data;
    if (!data) {
      throw new VehicleExternalLookupNotFoundException();
    }

    return data;
  }
}
