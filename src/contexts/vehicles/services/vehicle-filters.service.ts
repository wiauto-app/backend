import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";

import { ActiveFiltersLookupPort } from "../ports/active-filters-lookup.port";
import { CatalogFuelTypesService } from "../catalog/fuel_types/services/catalog-fuel-types.service";
import { ActiveFiltersResponse } from "../types/active-filters-response";
import { FindActiveFiltersDto } from "../dto/find-active-filters.dto";
import { mapActiveFiltersApplied } from "../dto/map-active-filters-applied";
import { ColorsService } from "./colors.service";
import { CuotasService } from "./cuotas.service";
import { DgtLabelsService } from "./dgt-labels.service";
import { FeaturesService } from "./features.service";
import { ServicesService } from "./services.service";
import { TractionsService } from "./tractions.service";
import { VehicleTypesService } from "./vehicle-types.service";
import { WarrantyTypesService } from "./warranty-types.service";
import { buildActiveFiltersTitle } from "../utils/build-active-filters-title";

@Injectable()
export class VehicleFiltersService {
  constructor(
    private readonly vehicle_types_service: VehicleTypesService,
    private readonly services_service: ServicesService,
    private readonly cuotas_service: CuotasService,
    private readonly tractions_service: TractionsService,
    private readonly warranties_service: WarrantyTypesService,
    private readonly colors_service: ColorsService,
    private readonly dgt_labels_service: DgtLabelsService,
    private readonly features_service: FeaturesService,
    private readonly fuel_types_service: CatalogFuelTypesService,
    private readonly active_filters_lookup_port: ActiveFiltersLookupPort,
  ) { }

  async findFilters() {
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
      this.vehicle_types_service.findAll({
        page: 1,
        limit: 100,
        order_by: "name",
        order_direction: "ASC",
        skip: 0,
      }),
      this.services_service.findAll({
        page: 1,
        limit: 100,
        order_by: "name",
        order_direction: "ASC",
        skip: 0,
      }),
      this.cuotas_service.findAll({
        page: 1,
        limit: 100,
        order_by: "value",
        order_direction: "ASC",
        skip: 0,
      }),
      this.tractions_service.findAll({
        page: 1,
        limit: 100,
        order_by: "name",
        order_direction: "ASC",
        skip: 0,
      }),
      this.warranties_service.findAll({
        page: 1,
        limit: 100,
        order_by: "name",
        order_direction: "ASC",
        skip: 0,
      }),
      this.colors_service.findAll({
        page: 1,
        limit: 100,
        order_by: "name",
        order_direction: "ASC",
        skip: 0,
      }),
      this.dgt_labels_service.findAll({
        page: 1,
        limit: 100,
        order_by: "name",
        order_direction: "ASC",
        skip: 0,
      }),
      this.features_service.findAll({
        page: 1,
        limit: 100,
        order_by: "name",
        order_direction: "ASC",
        skip: 0,
      }),
      this.fuel_types_service.findAll({
        page: 1,
        limit: 100,
        order_by: "name",
        order_direction: "ASC",
      }),
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
    };
  }

  async findActiveFilters(
    find_active_filters_dto: FindActiveFiltersDto,
  ): Promise<ActiveFiltersResponse> {
    const resolved = await this.active_filters_lookup_port.resolveResolved(
      find_active_filters_dto,
    );

    return {
      resolved,
      applied: mapActiveFiltersApplied(find_active_filters_dto),
      title: buildActiveFiltersTitle(resolved, find_active_filters_dto),
    };
  }
}
