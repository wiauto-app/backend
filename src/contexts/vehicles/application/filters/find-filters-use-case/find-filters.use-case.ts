import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { VehicleTypesUseCase } from "../../vehicle-types-use-cases/vehicle-types.use-case";
import { ServicesUseCase } from "../../services-use-cases/services.use-case";
import { CuotasUseCase } from "../../cuotas-use-cases/cuotas.use-case";
import { TractionsUseCase } from "../../tractions-use-cases/tractions.use-case";
import { WarrantyTypesUseCase } from "../../warranty-types-use-cases/warranty-types.use-case";
import { ColorsUseCase } from "../../colors-use-cases/colors.use-case";
import { DgtLabelsUseCase } from "../../dgt-labels-use-cases/dgt-labels.use-case";
import { FindFeaturesUseCase } from "../../features/find-features-use-case/find-features.use-case";
import { CatalogFuelTypesUseCase } from "../../../catalog/fuel_types/application/catalog-fuel-types-use-cases/catalog-fuel-types.use-case";

@Injectable()
export class FindFiltersUseCase {
  constructor(
    private readonly vehicleTypesUseCase: VehicleTypesUseCase,
    private readonly servicesUseCase: ServicesUseCase,
    private readonly cuotasUseCase: CuotasUseCase,
    private readonly tractionsUseCase: TractionsUseCase,
    private readonly warrantiesUseCase: WarrantyTypesUseCase,
    private readonly colorsUseCase: ColorsUseCase,
    private readonly dgtLabelsUseCase: DgtLabelsUseCase,
    private readonly featuresUseCase: FindFeaturesUseCase,
    private readonly fuelTypesUseCase: CatalogFuelTypesUseCase,
  ) { }
  async execute() {
    const [
      vehicleTypes,
      services,
      cuotas,
      tractions,
      warranties,
      colors,
      dgtLabels,
      features,
      fuels,
    ] = await Promise.all([
      this.vehicleTypesUseCase.findAll({ page: 1, limit: 100, order_by: "name", order_direction: "ASC", skip: 0 }),
      this.servicesUseCase.findAll({ page: 1, limit: 100, order_by: "name", order_direction: "ASC", skip: 0 }),
      this.cuotasUseCase.findAll({ page: 1, limit: 100, order_by: "value", order_direction: "ASC", skip: 0 }),
      this.tractionsUseCase.findAll({ page: 1, limit: 100, order_by: "name", order_direction: "ASC", skip: 0 }),
      this.warrantiesUseCase.findAll({ page: 1, limit: 100, order_by: "name", order_direction: "ASC", skip: 0 }),
      this.colorsUseCase.findAll({ page: 1, limit: 100, order_by: "name", order_direction: "ASC", skip: 0 }),
      this.dgtLabelsUseCase.findAll({ page: 1, limit: 100, order_by: "name", order_direction: "ASC", skip: 0 }),
      this.featuresUseCase.execute({ page: 1, limit: 100, order_by: "name", order_direction: "ASC" }),
      this.fuelTypesUseCase.findAll({ page: 1, limit: 100, order_by: "name", order_direction: "ASC" }),
    ]);

    return {
      vehicleTypes: vehicleTypes.data,
      services: services.data,
      cuotas: cuotas.data,
      tractions: tractions.data,
      warranties: warranties.data,
      colors: colors.data,
      dgtLabels: dgtLabels.data,
      features: features.data,
      fuels: fuels.data,
    }
  }
}