import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ProfileDevices } from "./entities/profile_devices.entity";
import { ProfileDevicesController } from "./api/profile-devices.controller";
import { ProfileDevicesService } from "./services/profile-devices.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([ProfileDevices]),
  ],
  controllers: [ProfileDevicesController],
  providers: [ProfileDevicesService],
  exports: [ProfileDevicesService],
})
export class ProfileDevicesModule {}