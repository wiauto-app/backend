import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { CreateDealershipUseCase } from "./application/dealership/create-dealership-use-case/create-dealership.use-case";
import { FindAllDealershipUseCase } from "./application/dealership/find-all-dealership-use-case/find-all-dealership.use-case";
import { FindOneDealershipUseCase } from "./application/dealership/find-one-dealership-use-case/find-one-dealership.use-case";
import { RemoveDealershipUseCase } from "./application/dealership/remove-dealership-use-case/remove-dealership.use-case";
import { UpdateDealershipUseCase } from "./application/dealership/update-dealership-use-case/update-dealership.use-case";
import { DealershipRepository } from "./domain/repositories/dealership.repository";
import { CreateDealershipController } from "./infrastructure/http-api/v1/create-dealership/create-dealership.controller";
import { FindAllDealershipsController } from "./infrastructure/http-api/v1/find-all-dealerships/find-all-dealerships.controller";
import { FindDealershipController } from "./infrastructure/http-api/v1/find-dealership/find-dealership.controller";
import { RemoveDealershipController } from "./infrastructure/http-api/v1/remove-dealership/remove-dealership.controller";
import { UpdateDealershipController } from "./infrastructure/http-api/v1/update-dealership/update-dealership.controller";
import { DealershipEntity } from "./infrastructure/persistence/dealership.entity";
import { TypeOrmDealershipRepository } from "./infrastructure/repositories/typeorm.dealership-repository";
import { DealershipInvitationModule } from "./modules/dealership-invitation.module";

@Module({
  imports: [TypeOrmModule.forFeature([DealershipEntity]),DealershipInvitationModule],
  controllers: [
    CreateDealershipController,
    FindAllDealershipsController,
    FindDealershipController,
    UpdateDealershipController,
    RemoveDealershipController,
  ],
  providers: [
    CreateDealershipUseCase,
    FindAllDealershipUseCase,
    FindOneDealershipUseCase,
    UpdateDealershipUseCase,
    RemoveDealershipUseCase,
    TypeOrmDealershipRepository,
    {
      provide: DealershipRepository,
      useExisting: TypeOrmDealershipRepository,
    },
  ],
  exports: [DealershipRepository],
})
export class DealershipModule {}
