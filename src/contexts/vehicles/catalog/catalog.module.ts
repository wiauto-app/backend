import { Module } from "@nestjs/common";
import { MakesModule } from "./makes/modules/makes.module";
import { CatalogYearsModule } from "./years/modules/catalog-years.module";
import { CatalogBodyTypesModule } from "./body_types/modules/catalog-body-types.module";
import { CatalogFuelTypesModule } from "./fuel_types/modules/catalog-fuel-types.module";
import { CatalogModelsModule } from "./models/modules/catalog-models.module";
import { CatalogVersionsModule } from "./versions/modules/catalog-versions.module";

@Module({
  imports: [
    MakesModule,
    CatalogYearsModule,
    CatalogBodyTypesModule,
    CatalogFuelTypesModule,
    CatalogModelsModule,
    CatalogVersionsModule,
  ],
  exports: [
    MakesModule,
    CatalogYearsModule,
    CatalogBodyTypesModule,
    CatalogFuelTypesModule,
    CatalogModelsModule,
    CatalogVersionsModule,
  ],
})
export class CatalogModule {}
