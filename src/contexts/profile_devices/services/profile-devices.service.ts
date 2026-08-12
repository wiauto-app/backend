import { Injectable } from "@nestjs/common";
import { Repository } from "typeorm";
import { ProfileDevices } from "../entities/profile_devices.entity";
import { CreateProfileDeviceDto } from "../dto/create-profile-device.dto";
import { InjectRepository } from "@nestjs/typeorm";

@Injectable()
export class ProfileDevicesService {

  constructor(
    @InjectRepository(ProfileDevices)
    private readonly profileDevicesRepository: Repository<ProfileDevices>,
  ) {}

  async createProfileDevice(createProfileDeviceDto: CreateProfileDeviceDto, userId: string) {
    const profileDevice = this.profileDevicesRepository.create(createProfileDeviceDto);
    return this.profileDevicesRepository.save({
      ...profileDevice,
      userId,
    });
  }
}