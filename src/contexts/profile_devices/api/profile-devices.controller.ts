import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from "@nestjs/common";
import { PROFILE_DEVICES_V1 } from "../route.constants";
import { JwtGuard } from "../../auth/guards/auth.guard";
import { ProfileDevicesService } from "../services/profile-devices.service";
import { CreateProfileDeviceDto } from "../dto/create-profile-device.dto";
import { UnregisterProfileDeviceDto } from "../dto/unregister-profile-device.dto";
import { GetUserId } from "../../auth/decorators/GetUserId.decorator";

@Controller(PROFILE_DEVICES_V1)
@UseGuards(JwtGuard)
export class ProfileDevicesController {
  constructor(private readonly profileDevicesService: ProfileDevicesService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async createProfileDevice(@Body() createProfileDeviceDto: CreateProfileDeviceDto, @GetUserId() user_id: string) {
    return this.profileDevicesService.createProfileDevice(createProfileDeviceDto, user_id);
  }

  @Post("unregister")
  @HttpCode(HttpStatus.NO_CONTENT)
  async unregisterProfileDevice(
    @Body() unregisterProfileDeviceDto: UnregisterProfileDeviceDto,
    @GetUserId() user_id: string,
  ): Promise<void> {
    await this.profileDevicesService.unregister(unregisterProfileDeviceDto.token, user_id);
  }
}
