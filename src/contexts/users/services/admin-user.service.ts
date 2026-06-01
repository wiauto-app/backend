import { Injectable } from "../../shared/dependency-injectable/injectable";
import { AdminCreateUserDto } from "../dto/admin/create-user.dto";
import { User } from "../entities/user.entity";
import { Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { ConflictException, NotFoundException } from "@nestjs/common";
import { PasswordService } from "../../auth/services/password.service";
import { AdminUpdateUserDto } from "../dto/admin/update-user.dto";
import { ProfileEntity } from "../../profiles/infrastructure/persistence/profile.entity";

@Injectable()
export class AdminUserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly passwordService: PasswordService,
  ) { }

  async create(createUserDto: AdminCreateUserDto): Promise<User> {
    const user = await this.userRepository.manager.transaction(async (entity_manager) => {
      const user_repository = entity_manager.getRepository(User);
      const profile_repository = entity_manager.getRepository(ProfileEntity);

      const existing_user = await user_repository.findOne({
        where: { email: createUserDto.email },
      });

      if (existing_user) {
        throw new ConflictException("Ya existe un usuario registrado con ese email");
      }

      const hashed_password = await this.passwordService.hashPassword(
        createUserDto.password,
      );

      const created_user = user_repository.create({
        email: createUserDto.email,
        password: hashed_password,
        is_email_verified: true,
        provider: "local",
      });
      const saved_user = await user_repository.save(created_user);

      const created_profile = profile_repository.create({
        id: saved_user.id,
        name: createUserDto.name,
        last_name: createUserDto.last_name,
        role_id: createUserDto.role_id,
        avatar_url: createUserDto.avatar_url,
      });

      await profile_repository.save(created_profile);

      const hydrated_user = await user_repository.findOne({
        where: { id: saved_user.id },
        relations: ["profile", "profile.role"],
      });

      if (!hydrated_user) {
        throw new NotFoundException("Usuario no encontrado");
      }

      return hydrated_user;
    });

    user.password = null;
    return user
  }

  async update(updateUserDto: AdminUpdateUserDto): Promise<User> {
    let hashedPassword: string | undefined;
    if (updateUserDto.password) {
      hashedPassword = await this.passwordService.hashPassword(updateUserDto.password)
    }

    const user = await this.userRepository.manager.transaction(async (entity_manager) => {
      const user_repository = entity_manager.getRepository(User);
      const profile_repository = entity_manager.getRepository(ProfileEntity);

      const existing_user = await user_repository.findOne({
        where: { id: updateUserDto.id },
        relations: ["profile"],
      });

      if (!existing_user) {
        throw new NotFoundException("Usuario no encontrado");
      }

      if (updateUserDto.email && updateUserDto.email !== existing_user.email) {
        const duplicate_user = await user_repository.findOne({
          where: { email: updateUserDto.email },
        });
        if (duplicate_user && duplicate_user.id !== updateUserDto.id) {
          throw new ConflictException("Ya existe un usuario registrado con ese email");
        }
      }

      const user_to_update = await user_repository.preload({
        id: updateUserDto.id,
        email: updateUserDto.email,
        password: hashedPassword ?? undefined,
        suspension_duration_type_id: updateUserDto.suspension_duration_type_id,
        suspension_reason: updateUserDto.suspension_reason,
      });

      if (!user_to_update) {
        throw new NotFoundException("Usuario no encontrado");
      }

      await user_repository.save(user_to_update);

      const profile_to_update = await profile_repository.preload({
        id: updateUserDto.id,
        name: updateUserDto.name,
        last_name: updateUserDto.last_name,
        role_id: updateUserDto.role_id,
        avatar_url: updateUserDto.avatar_url,
      });

      if (!profile_to_update) {
        throw new NotFoundException("Perfil no encontrado");
      }

      await profile_repository.save(profile_to_update);

      const hydrated_user = await user_repository.findOne({
        where: { id: updateUserDto.id },
        relations: ["profile", "profile.role"],
      });

      if (!hydrated_user) {
        throw new NotFoundException("Usuario no encontrado");
      }

      return hydrated_user;
    });

    user.password = null;
    return user
  }

  async delete(id: string): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id }
    })
    if (!user) {
      throw new NotFoundException("Usuario no encontrado")
    }
    await this.userRepository.delete(id)
  }
}