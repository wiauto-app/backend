import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";
import { Provinces } from "@/src/contexts/locations/provinces/entities/province.entity";
import { Comunity } from "@/src/contexts/locations/comunities/entities/comunity.entity";
import { Municipality } from "@/src/contexts/locations/municipalities/entities/municipality.entity";
import { MakeEntity } from "../catalog/makes/entities/make.entity";
import { CatalogModelEntity } from "../catalog/models/entities/catalog-model.entity";
import { CatalogFuelTypeEntity } from "../catalog/fuel_types/entities/catalog-fuel-type.entity";
import { VehicleTypeEntity } from "../entities/vehicle-type.entity";
import { ColorEntity } from "../entities/color.entity";
import { ServiceEntity } from "../entities/service.entity";
import { DgtLabelEntity } from "../entities/dgt-label.entity";
import { WarrantyTypeEntity } from "../entities/warranty-type.entity";
import { TractionEntity } from "../entities/traction.entity";
import { CuotaEntity } from "../entities/cuota.entity";
import { FeaturesEntity } from "../entities/features.entity";
import { CategoryEntity } from "../entities/category.entity";
import { ActiveFiltersLookupPort } from "../ports/active-filters-lookup.port";
import { FindActiveFiltersDto } from "../dto/find-active-filters.dto";
import { ActiveFiltersResolved } from "../types/active-filters-response";
import { ActiveFilterItem } from "../types/active-filter-item";
import {
  has_non_empty_slug_array,
  order_active_filter_items_by_ids,
  order_active_filter_items_by_slugs,
  trim_slug_array,
} from "./active-filters-lookup.utils";

@Injectable()
export class TypeOrmActiveFiltersLookupAdapter extends ActiveFiltersLookupPort {
  constructor(
    @InjectRepository(VehicleTypeEntity)
    private readonly vehicle_type_repository: Repository<VehicleTypeEntity>,
    @InjectRepository(MakeEntity)
    private readonly make_repository: Repository<MakeEntity>,
    @InjectRepository(CatalogModelEntity)
    private readonly catalog_model_repository: Repository<CatalogModelEntity>,
    @InjectRepository(Provinces)
    private readonly province_repository: Repository<Provinces>,
    @InjectRepository(Comunity)
    private readonly community_repository: Repository<Comunity>,
    @InjectRepository(Municipality)
    private readonly municipality_repository: Repository<Municipality>,
    @InjectRepository(ServiceEntity)
    private readonly service_repository: Repository<ServiceEntity>,
    @InjectRepository(WarrantyTypeEntity)
    private readonly warranty_repository: Repository<WarrantyTypeEntity>,
    @InjectRepository(ColorEntity)
    private readonly color_repository: Repository<ColorEntity>,
    @InjectRepository(DgtLabelEntity)
    private readonly dgt_label_repository: Repository<DgtLabelEntity>,
    @InjectRepository(FeaturesEntity)
    private readonly feature_repository: Repository<FeaturesEntity>,
    @InjectRepository(CatalogFuelTypeEntity)
    private readonly fuel_type_repository: Repository<CatalogFuelTypeEntity>,
    @InjectRepository(TractionEntity)
    private readonly traction_repository: Repository<TractionEntity>,
    @InjectRepository(CuotaEntity)
    private readonly cuota_repository: Repository<CuotaEntity>,
    @InjectRepository(CategoryEntity)
    private readonly category_repository: Repository<CategoryEntity>,
  ) {
    super();
  }

  async resolveResolved(
    find_active_filters_dto: FindActiveFiltersDto,
  ): Promise<ActiveFiltersResolved> {
    const type_slug = find_active_filters_dto.type_slug
    const makes_slugs = has_non_empty_slug_array(find_active_filters_dto.makes_slugs)
      ? trim_slug_array(find_active_filters_dto.makes_slugs)
      : [];
    const models_slugs = has_non_empty_slug_array(find_active_filters_dto.models_slugs)
      ? trim_slug_array(find_active_filters_dto.models_slugs)
      : [];
    const provinces_slugs = has_non_empty_slug_array(
      find_active_filters_dto.provinces_slugs,
    )
      ? trim_slug_array(find_active_filters_dto.provinces_slugs)
      : [];
    const communities_slugs = has_non_empty_slug_array(
      find_active_filters_dto.comunities_slugs,
    )
      ? trim_slug_array(find_active_filters_dto.comunities_slugs)
      : [];
    const municipalities_slugs = has_non_empty_slug_array(
      find_active_filters_dto.municipalities_slugs,
    )
      ? trim_slug_array(find_active_filters_dto.municipalities_slugs)
      : [];
    const service_slugs = has_non_empty_slug_array(
      find_active_filters_dto.service_slugs,
    )
      ? trim_slug_array(find_active_filters_dto.service_slugs)
      : [];
    const warranty_slugs = has_non_empty_slug_array(
      find_active_filters_dto.warranty_slugs,
    )
      ? trim_slug_array(find_active_filters_dto.warranty_slugs)
      : [];
    const color_slugs = has_non_empty_slug_array(find_active_filters_dto.color_slugs)
      ? trim_slug_array(find_active_filters_dto.color_slugs)
      : [];
    const dgt_label_ids = has_non_empty_slug_array(
      find_active_filters_dto.dgt_label_ids,
    )
      ? trim_slug_array(find_active_filters_dto.dgt_label_ids)
      : [];
    const features_slugs = has_non_empty_slug_array(
      find_active_filters_dto.features_slugs,
    )
      ? trim_slug_array(find_active_filters_dto.features_slugs)
      : [];
    const fuel_type_slugs = has_non_empty_slug_array(
      find_active_filters_dto.fuel_type_slugs,
    )
      ? trim_slug_array(find_active_filters_dto.fuel_type_slugs)
      : [];
    const traction_slugs = has_non_empty_slug_array(
      find_active_filters_dto.traction_slugs,
    )
      ? trim_slug_array(find_active_filters_dto.traction_slugs)
      : [];
    const cuota_slugs = has_non_empty_slug_array(find_active_filters_dto.cuota_slugs)
      ? trim_slug_array(find_active_filters_dto.cuota_slugs)
      : [];
    const categories_slugs = has_non_empty_slug_array(
      find_active_filters_dto.categories_slugs,
    )
      ? trim_slug_array(find_active_filters_dto.categories_slugs)
      : [];

    const [
      vehicle_type_row,
      make_rows,
      model_rows,
      province_rows,
      community_rows,
      municipality_rows,
      service_rows,
      warranty_rows,
      color_rows,
      dgt_label_rows,
      feature_rows,
      fuel_rows,
      traction_rows,
      cuota_rows,
      category_rows,
    ] = await Promise.all([
      type_slug
        ? this.vehicle_type_repository.findOne({ where: { slug: type_slug } })
        : Promise.resolve(null),
      makes_slugs.length > 0
        ? this.make_repository.find({ where: { slug: In(makes_slugs) } })
        : Promise.resolve([]),
      models_slugs.length > 0
        ? this.catalog_model_repository.find({ where: { slug: In(models_slugs) } })
        : Promise.resolve([]),
      provinces_slugs.length > 0
        ? this.province_repository.find({ where: { slug: In(provinces_slugs) } })
        : Promise.resolve([]),
      communities_slugs.length > 0
        ? this.community_repository.find({ where: { slug: In(communities_slugs) } })
        : Promise.resolve([]),
      municipalities_slugs.length > 0
        ? this.municipality_repository.find({
            where: { slug: In(municipalities_slugs) },
          })
        : Promise.resolve([]),
      service_slugs.length > 0
        ? this.service_repository.find({ where: { slug: In(service_slugs) } })
        : Promise.resolve([]),
      warranty_slugs.length > 0
        ? this.warranty_repository.find({ where: { slug: In(warranty_slugs) } })
        : Promise.resolve([]),
      color_slugs.length > 0
        ? this.color_repository.find({ where: { slug: In(color_slugs) } })
        : Promise.resolve([]),
      dgt_label_ids.length > 0
        ? this.dgt_label_repository.find({ where: { id: In(dgt_label_ids) } })
        : Promise.resolve([]),
      features_slugs.length > 0
        ? this.feature_repository.find({ where: { slug: In(features_slugs) } })
        : Promise.resolve([]),
      fuel_type_slugs.length > 0
        ? this.fuel_type_repository.find({ where: { slug: In(fuel_type_slugs) } })
        : Promise.resolve([]),
      traction_slugs.length > 0
        ? this.traction_repository.find({ where: { slug: In(traction_slugs) } })
        : Promise.resolve([]),
      cuota_slugs.length > 0
        ? this.cuota_repository.find({ where: { slug: In(cuota_slugs) } })
        : Promise.resolve([]),
      categories_slugs.length > 0
        ? this.category_repository.find({ where: { slug: In(categories_slugs) } })
        : Promise.resolve([]),
    ]);

    const vehicle_type: ActiveFilterItem | null = vehicle_type_row
      ? {
          id: vehicle_type_row.id,
          slug: vehicle_type_row.slug,
          name: vehicle_type_row.name,
        }
      : null;

    const makes = order_active_filter_items_by_slugs(
      make_rows.map((row) => ({
        id: row.id,
        slug: row.slug,
        name: row.name,
      })),
      makes_slugs,
    );

    const models = order_active_filter_items_by_slugs(
      model_rows.map((row) => ({
        id: row.id,
        slug: row.slug,
        name: row.name,
        make_id: row.make_id,
        model_id: row.model_id,
      })),
      models_slugs,
    );

    const categories = order_active_filter_items_by_slugs(
      category_rows.map((row) => ({
        id: row.id,
        slug: row.slug,
        name: row.name,
      })),
      categories_slugs,
    );

    const provinces = order_active_filter_items_by_slugs(
      province_rows.map((row) => ({
        id: row.id,
        slug: row.slug,
        name: row.name,
      })),
      provinces_slugs,
    );

    const communities = order_active_filter_items_by_slugs(
      community_rows.map((row) => ({
        id: row.id,
        slug: row.slug,
        name: row.name ?? row.cod_ccaa,
      })),
      communities_slugs,
    );

    const municipalities = order_active_filter_items_by_slugs(
      municipality_rows.map((row) => ({
        id: row.id,
        slug: row.slug,
        name: row.name ?? row.slug,
      })),
      municipalities_slugs,
    );

    const services = order_active_filter_items_by_slugs(
      service_rows.map((row) => ({
        id: row.id,
        slug: row.slug,
        name: row.name,
      })),
      service_slugs,
    );

    const warranties = order_active_filter_items_by_slugs(
      warranty_rows.map((row) => ({
        id: row.id,
        slug: row.slug,
        name: row.name,
      })),
      warranty_slugs,
    );

    const colors = order_active_filter_items_by_slugs(
      color_rows.map((row) => ({
        id: row.id,
        slug: row.slug,
        name: row.name,
        hex_code: row.hex_code,
      })),
      color_slugs,
    );

    const dgt_labels = order_active_filter_items_by_ids(
      dgt_label_rows.map((row) => ({
        id: row.id,
        slug: row.slug,
        name: row.name,
        code: row.code,
      })),
      dgt_label_ids,
    );

    const features = order_active_filter_items_by_slugs(
      feature_rows.map((row) => ({
        id: row.id,
        slug: row.slug,
        name: row.name,
      })),
      features_slugs,
    );

    const fuels = order_active_filter_items_by_slugs(
      fuel_rows.map((row) => ({
        id: row.id,
        slug: row.slug,
        name: row.name,
      })),
      fuel_type_slugs,
    );

    const tractions = order_active_filter_items_by_slugs(
      traction_rows.map((row) => ({
        id: row.id,
        slug: row.slug,
        name: row.name,
      })),
      traction_slugs,
    );

    const cuotas = order_active_filter_items_by_slugs(
      cuota_rows.map((row) => ({
        id: row.id,
        slug: row.slug,
        name: row.name,
        value: row.value,
      })),
      cuota_slugs,
    );

    return {
      vehicle_type,
      makes,
      models,
      categories,
      provinces,
      communities,
      municipalities,
      services,
      warranties,
      colors,
      dgt_labels,
      features,
      fuels,
      tractions,
      cuotas,
    };
  }
}
