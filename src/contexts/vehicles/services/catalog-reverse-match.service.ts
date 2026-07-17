import { ILike, Repository } from "typeorm";
import { Injectable } from "../../shared/dependency-injectable/injectable";
import { MakeEntity } from "../catalog/makes/entities/make.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { CatalogModelEntity } from "../catalog/models/entities/catalog-model.entity";
import { CatalogYearEntity } from "../catalog/years/entities/catalog-year.entity";
import { VersionEntity } from "../catalog/versions/entities/version.entity";
import { ApiVehicleData, ApiVehicleResponse, } from "../clients/apivehiculo.client";
import { BadRequestException } from "@nestjs/common";
import { TractionEntity } from "../entities/traction.entity";
import { TransmissionType } from "../types/vehicle";

@Injectable()
export class CatalogReverseMatchService {
  constructor(
    @InjectRepository(MakeEntity)
    private readonly make_repository: Repository<MakeEntity>,
    @InjectRepository(CatalogModelEntity)
    private readonly model_repository: Repository<CatalogModelEntity>,
    @InjectRepository(CatalogYearEntity)
    private readonly year_repository: Repository<CatalogYearEntity>,
    @InjectRepository(VersionEntity)
    private readonly version_repository: Repository<VersionEntity>,
    @InjectRepository(TractionEntity)
    private readonly traction_repository: Repository<TractionEntity>,
  ) { }


  /*

  {
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
       
      ]
    }

  type QuickVehicleSchema = {
    vehicle_type_id: string;
    images: { ... 2 more }[];
    videos: { ... 2 more }[];
    version_id: number;
    catalog_fuel_can_charge: boolean;
    condition: "new" | "used";
    mileage: number;
    price: number;
    color_id: string | null | undefined;
    category_id: string | null | undefined;
    dgt_label_id: string | null | undefined;
    lat: number;
    lng: number;
    phone: { ... 2 more };
    show_phone: boolean;
    has_whatsapp: boolean;
    email: string;
    transmission_type: "manual" | "automatic";
    power: number;
    displacement: number;
    traction_id: string;
    features_ids: string[];
    services_ids: string[];
    cuota_ids: string[];
    warranty_type_id: string | null | undefined;
    publisher_type: "professional" | "particular";
    license_plate: string | undefined;
    vin_code: string | undefined;
    catalog_make_id: number | undefined;
    catalog_model_id: number | undefined;
    catalog_year_id: number | undefined;
    catalog_fuel_type_id: number | undefined;
    description: string | undefined;
    autonomy: number | undefined;
    battery_capacity: number | undefined;
    time_to_charge: number | undefined;
}

  
  */

  async execute(api_data: ApiVehicleData): Promise<ApiVehicleResponse> {
    if (!api_data.version) {
      throw new BadRequestException("Version is required");
    }
    const version = await this.version_repository.findOne({
      where: {
        name: ILike(api_data.version),
      },
    });

    if (!version) {
      throw new BadRequestException("Version not found");
    }

    const traction_id = await this.getTractionId(api_data.transmissionType);
    const transmission_type = this.getTransmissionType(api_data.gearboxType);
    return {
      version_id: version.id,
      catalog_make_id: version.make_id,
      catalog_model_id: version.model_id,
      catalog_year_id: version.year_id,
      power: Number(api_data.powerHP),
      displacement: Number(api_data.engineCapacityLiters) * 1000,
      traction_id,
      transmission_type,
      vin: api_data.vin,
      license_plate: api_data.plate,
    };
  }

  async getTractionId(traction_type: string) {
    const mapping = {
      'FWD': 'traccion-delantera',
      'RWD': 'traccion-trasera',
      'AWD': 'traccion-integral',
    }
    const slug = mapping[traction_type as keyof typeof mapping];
    const traction = await this.traction_repository.findOne({
      where: {
        slug
      },
    });

    if (!traction) {
      throw new BadRequestException("Traction not found");
    }
    return traction.id;
  }

  getTransmissionType(transmission_type: string): TransmissionType {
    // Devuelve uno de los valores del enum TRANSMISSION_TYPE según el tipo recibido
    // Normaliza a minúsculas para asegurar el mapeo correcto
    const normalized = transmission_type.trim().toLowerCase();

    // Manual
    if (
      normalized === "manual" ||
      normalized === "sequential"
    ) {
      return "manual";
    }

    // Automático
    if (
      normalized === "automatic" ||
      normalized === "cvt" ||
      normalized === "automated_manual"
    ) {
      return "automatic";
    }

    throw new BadRequestException(
      `Tipo de transmisión desconocido: ${transmission_type}`
    );
  }
}