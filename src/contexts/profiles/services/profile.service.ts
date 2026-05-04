import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { User } from "../../users/entities/user.entity";
import { Roles } from "../../roles/entities/roles.entity";
import { CreateProfileDto } from "../dto/create-profile";
import { UpdateProfileDto } from "../dto/update-profile.dto";
import { Profile } from "../entities/profile.entity";

@Injectable()
export class ProfileService {
  constructor(
    @InjectRepository(Profile)
    private readonly profileRepository: Repository<Profile>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async createProfile(createProfileDto: CreateProfileDto) {
    const profile = this.profileRepository.create({
      id: createProfileDto.id,
      name: createProfileDto.name,
      last_name: createProfileDto.last_name,
      ...(createProfileDto.role_id
        ? { role: { id: createProfileDto.role_id } as Roles }
        : {}),
    });
    return await this.profileRepository.save(profile);
  }

  /** Alta desde API admin: exige usuario existente y perfil inexistente. */
  async adminCreateProfile(dto: CreateProfileDto): Promise<Profile> {
    const user_exists = await this.userRepository.exist({ where: { id: dto.id } });
    if (!user_exists) {
      throw new NotFoundException("No se encontró el usuario");
    }
    const profile_exists = await this.profileRepository.exist({ where: { id: dto.id } });
    if (profile_exists) {
      throw new ConflictException("Ya existe un perfil para este usuario");
    }
    return this.createProfile(dto);
  }

  async findAll(): Promise<Profile[]> {
    return this.profileRepository.find({
      relations: { role: true },
      order: { id: "ASC" },
    });
  }

  async updateProfile(user_id: string, dto: UpdateProfileDto): Promise<Profile> {
    const profile = await this.profileRepository.preload({ id: user_id });
    if (!profile) {
      throw new NotFoundException("No se ha encontrado el perfil");
    }
    if (dto.name !== undefined) profile.name = dto.name;
    if (dto.last_name !== undefined) profile.last_name = dto.last_name;
    if (dto.role_id !== undefined) {
      profile.role = dto.role_id ? ({ id: dto.role_id } as Roles) : null;
    }
    return await this.profileRepository.save(profile);
  }

  async findOne(id: string): Promise<Profile> {
    const profile = await this.profileRepository.findOne({
      where: { id },
      relations: { role: true },
    });
    if (!profile) {
      throw new NotFoundException("No se ha encontrado el perfil");
    }
    return profile;
  }

  async removeProfile(id: string): Promise<void> {
    const profile = await this.profileRepository.findOne({ where: { id } });
    if (!profile) {
      throw new NotFoundException("No se ha encontrado el perfil");
    }
    await this.profileRepository.delete(id);
  }

  async fillMissingNames(
    userId: string,
    data: { name?: string | null; last_name?: string | null },
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
