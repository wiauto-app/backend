import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { CatalogFuelTypesService } from "@/src/contexts/vehicles/catalog/fuel_types/services/catalog-fuel-types.service";
import { CatalogModelsService } from "@/src/contexts/vehicles/catalog/models/services/catalog-models.service";
import { MakesService } from "@/src/contexts/vehicles/catalog/makes/services/makes.service";
import { CatalogVersionsService } from "@/src/contexts/vehicles/catalog/versions/services/catalog-versions.service";
import { CatalogYearsService } from "@/src/contexts/vehicles/catalog/years/services/catalog-years.service";
import { InvalidateVehicleVersionIdException } from "@/src/contexts/vehicles/exceptions/InvalidateVehicleVersionId.exception";
import { ColorsService } from "@/src/contexts/vehicles/services/colors.service";
import { DgtLabelsService } from "@/src/contexts/vehicles/services/dgt-labels.service";
import { TractionsService } from "@/src/contexts/vehicles/services/tractions.service";
import { VehicleTypesService } from "@/src/contexts/vehicles/services/vehicle-types.service";
import { CategoriesService } from "@/src/contexts/vehicles/services/categories.service";
import { VehicleAiContextDto } from "../dto/vehicle-ai-context.dto";

export interface ResolvedVehicleAiLabels {
  make_name: string;
  model_name: string;
  year: number;
  fuel_type_name: string;
  version_name: string;
  condition: string;
  mileage: number;
  transmission_type: string;
  power: number;
  displacement?: number;
  autonomy?: number;
  battery_capacity?: number;
  time_to_charge?: number;
  color_name?: string;
  category_name?: string;
  dgt_label_name?: string;
  traction_name?: string;
  vehicle_type_name?: string;
  publisher_type?: string;
}

@Injectable()
export class VehicleAiContextResolverService {
  constructor(
    private readonly catalog_versions_service: CatalogVersionsService,
    private readonly makes_service: MakesService,
    private readonly catalog_models_service: CatalogModelsService,
    private readonly catalog_years_service: CatalogYearsService,
    private readonly catalog_fuel_types_service: CatalogFuelTypesService,
    private readonly colors_service: ColorsService,
    private readonly categories_service: CategoriesService,
    private readonly dgt_labels_service: DgtLabelsService,
    private readonly tractions_service: TractionsService,
    private readonly vehicle_types_service: VehicleTypesService,
  ) {}

  async resolve(context: VehicleAiContextDto): Promise<ResolvedVehicleAiLabels> {
    const version = await this.catalog_versions_service.findById(
      context.version_id,
    );
    if (!version) {
      throw new InvalidateVehicleVersionIdException();
    }

    const [make, model, year_row, fuel_type] = await Promise.all([
      this.makes_service.findById(version.make_id),
      this.catalog_models_service.findById(version.model_id),
      this.catalog_years_service.findById(version.year_id),
      this.catalog_fuel_types_service.findById(version.fuel_type_id),
    ]);

    if (!make || !model || !year_row || !fuel_type) {
      throw new InvalidateVehicleVersionIdException();
    }

    const [color, category, dgt_label, traction, vehicle_type] =
      await Promise.all([
        context.color_id
          ? this.colors_service.findById(context.color_id)
          : Promise.resolve(null),
        context.category_id
          ? this.categories_service.findById(context.category_id)
          : Promise.resolve(null),
        context.dgt_label_id
          ? this.dgt_labels_service.findById(context.dgt_label_id)
          : Promise.resolve(null),
        context.traction_id
          ? this.tractions_service.findById(context.traction_id)
          : Promise.resolve(null),
        context.vehicle_type_id
          ? this.vehicle_types_service.findById(context.vehicle_type_id)
          : Promise.resolve(null),
      ]);

    return {
      make_name: make.name,
      model_name: model.name,
      year: year_row.year,
      fuel_type_name: fuel_type.name,
      version_name: version.name,
      condition: context.condition,
      mileage: context.mileage,
      transmission_type: context.transmission_type,
      power: context.power,
      displacement: context.displacement,
      autonomy: context.autonomy,
      battery_capacity: context.battery_capacity,
      time_to_charge: context.time_to_charge,
      color_name: color?.name,
      category_name: category?.name,
      dgt_label_name: dgt_label?.name,
      traction_name: traction?.name,
      vehicle_type_name: vehicle_type?.name,
      publisher_type: context.publisher_type,
    };
  }
}
