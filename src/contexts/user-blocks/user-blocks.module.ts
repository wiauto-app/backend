import { Module, forwardRef } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { AuthModule } from "@/src/contexts/auth/auth.module";
import { ProfileModule } from "@/src/contexts/profiles/profile.module";

import { CreateUserBlockController } from "./api/create-user-block/create-user-block.controller";
import { DeleteUserBlockController } from "./api/delete-user-block/delete-user-block.controller";
import { FindUserBlocksController } from "./api/find-user-blocks/find-user-blocks.controller";
import { UserBlockEntity } from "./entities/user-block.entity";
import { UserBlocksService } from "./services/user-blocks.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([UserBlockEntity]),
    // Auth ← Billing ← Vehicles ← Chat ← UserBlocks: evitar TDZ de AuthModule
    forwardRef(() => AuthModule),
    ProfileModule,
  ],
  controllers: [
    CreateUserBlockController,
    FindUserBlocksController,
    DeleteUserBlockController,
  ],
  providers: [UserBlocksService],
  exports: [UserBlocksService],
})
export class UserBlocksModule {}
