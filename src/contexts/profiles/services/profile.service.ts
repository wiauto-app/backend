import { Repository } from "typeorm";
import { Profile } from "../entities/profile.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { CreateProfileDto } from "../dto/create-profile";
import { NotFoundException } from "@nestjs/common";

export class ProfileService {
  constructor(
    @InjectRepository(Profile)
    private readonly profileRepository: Repository<Profile>
  ) { }

  async createProfile(createProfileDto: CreateProfileDto) {
    const profile = this.profileRepository.create(createProfileDto)
    return await this.profileRepository.save(profile)
  }

  async findOne(id: string):Promise<Profile> {
    const profile = await this.profileRepository.findOne(
      {
        where: { id }
      }
    )
    if(!profile){
      throw new NotFoundException("No se ha encontrado el perfil")
    }
    return profile
  }

  async fillMissingNames(
    userId: string,
    data: { name?: string | null; last_name?: string | null }
  ): Promise<void> {
    const profile = await this.profileRepository.findOne({ where: { id: userId } });
    if (!profile) return;

    let dirty = false;
    if (!profile.name && data.name) {
      profile.name = data.name;
      dirty = true;
    }
    if (!profile.last_name && data.last_name) {
      profile.last_name = data.last_name;
      dirty = true;
    }

    if (dirty) {
      await this.profileRepository.save(profile);
    }
  }
}
