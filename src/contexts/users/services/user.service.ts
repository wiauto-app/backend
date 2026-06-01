import {
  ConflictException,
  forwardRef,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";

import { Repository } from "typeorm";

import { VehicleEntity } from "../../vehicles/infrastructure/persistence/vehicle.entity";
import { AuthProvider, User } from "../entities/user.entity";
import { RegisterUserDto } from '../dto/register-user.dto'
import { PasswordService } from "../../auth/services/password.service";
import { UpdateEmailDto } from "../dto/update-email.dto";
import { ApiResponse } from "@/src/common/types/default.types";
import { UpdatePasswordDto } from "../dto/update-password.dto";
import { GetUserByEmailDto } from "../dto/get-user-by-email.dto";
import { ProfileService } from "../../profiles/services/profile.service";
import { UpdateUserDto } from "../dto/update-user.dto";
import { EmailVerificationService } from "../../auth/services/email-verification.service";
import { ProfileRepository } from "../../profiles/domain/repositories/profile.repository";

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(VehicleEntity)
    private readonly vehicleRepository: Repository<VehicleEntity>,
    private readonly passwordService: PasswordService,
    private readonly profileService: ProfileService,
    private readonly profileRepository: ProfileRepository,
    @Inject(forwardRef(() => EmailVerificationService))
    private readonly emailVerificationService: EmailVerificationService,
  ) { }

  async create(registerUserDto: RegisterUserDto): Promise<ApiResponse<User>> {
    console.log(registerUserDto)
    const existingUser = await this.userRepository.findOne({
      where: {
        email: registerUserDto.email
      }
    })

    if (existingUser) {
      throw new ConflictException("Ya existe un usuario registrado con ese email")
    }

    const hashedPassword = await this.passwordService.hashPassword(registerUserDto.password)

    const createdUser = this.userRepository.create({
      email: registerUserDto.email,
      password: hashedPassword,
    })
    const user = await this.userRepository.save(createdUser)
    await this.profileService.createProfile({
      id: user.id,
      name: registerUserDto.name,
      last_name: registerUserDto.last_name,
      role_id: registerUserDto.role_id,
    });

    void this.emailVerificationService
      .enqueueSendVerificationForUser(user.id, user.email)
      .catch((error: unknown) => {
        this.logger.error(
          `No se pudo enviar el correo de verificación a ${user.email}`,
          error instanceof Error ? error.stack : String(error),
        );
      });

    user.password = null;
    user.two_factor_backup_codes = null;
    user.two_factor_secret = null;
    user.provider_id = null;
    return {
      message: "Te enviamos un correo con el enlace de verificación.",
      data: user,
    };
  }

  async findOrCreateOAuthUser(profile: {
    provider: Exclude<AuthProvider, "local">;
    provider_id: string;
    email: string;
    first_name: string;
    last_name?: string | null;
    role_id: string;
  }): Promise<User> {
    const existing = await this.userRepository.findOne({ where: { email: profile.email } });

    if (existing) {
      const shouldLink = existing.provider === "local" || existing.provider_id !== profile.provider_id;
      if (shouldLink) {
        existing.provider = profile.provider;
        existing.provider_id = profile.provider_id;
        await this.userRepository.save(existing);

      }
      return existing;
    }

    const created = this.userRepository.create({
      email: profile.email,
      password: null,
      provider: profile.provider,
      provider_id: profile.provider_id,
      is_email_verified: true,
    });
    const saved = await this.userRepository.save(created);
    await this.profileService.createProfile({
      id: saved.id,
      name: profile.first_name,
      last_name: profile.last_name ?? undefined,
      role_id: profile.role_id,
    });
    saved.password = null;
    return saved;
  }

  async getUserByEmail(getUserByEmailDto: GetUserByEmailDto): Promise<User> {
    const user = await this.userRepository.findOne({
      where: {
        email: getUserByEmailDto.email
      },
      ...(getUserByEmailDto.selectPrivateFields && { select: ["id", "email", "provider", "provider_id", "last_sign_in", "is_email_verified", "two_factor_enabled", "two_factor_secret", "two_factor_backup_codes", "created_at", "password"] })
    })

    if (!user) {
      throw new NotFoundException("No se encontró el usuario")
    }

    return user
  }

  async findOneByEmailWithPassword(email: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: {
        email
      },
      select: ["id", "email", "provider", "provider_id", "last_sign_in", "is_email_verified", "two_factor_enabled", "two_factor_secret", "two_factor_backup_codes", "created_at", "password"]
    })
    if (!user) {
      throw new NotFoundException("No se encontró el usuario")
    }
    return user
  }

  /** Email + contraseña seleccionable + perfil y rol (panel admin / staff). */
  async findOneByEmailWithPasswordAndProfileRole(email: string): Promise<User> {
    const user = await this.userRepository
      .createQueryBuilder("user")
      .addSelect("user.password")
      .innerJoinAndSelect("user.profile", "profile")
      .leftJoinAndSelect("profile.role", "role")
      .where("user.email = :email", { email })
      .getOne();

    if (!user) {
      throw new NotFoundException("No se encontró el usuario");
    }

    return user;
  }

  async findAll(): Promise<User[]> {
    const users = await this.userRepository.find({
      order: { created_at: "DESC" },
    });
    for (const user of users) {
      user.password = null;
      user.two_factor_secret = null;
      user.two_factor_backup_codes = null;
    }
    return users;
  }

  async remove(id: string): Promise<void> {
    const vehicle_count = await this.vehicleRepository.count({
      where: { profile: { id } },
    });
    if (vehicle_count > 0) {
      throw new ConflictException(
        "No se puede eliminar el usuario: tiene anuncios de vehículos asociados.",
      );
    }
    const result = await this.userRepository.delete(id);
    if (!result.affected) {
      throw new NotFoundException("No se encontró el usuario");
    }
  }

  async findOne(id: string, selectPrivateFields = false): Promise<User> {
    const user = await this.userRepository.findOne({
      where: {
        id
      },
      ...(selectPrivateFields && { select: ["id", "email", "provider", "provider_id", "last_sign_in", "is_email_verified", "two_factor_enabled", "two_factor_secret", "two_factor_backup_codes", "created_at", "password"] }),
      relations:["profile","profile.role"]
    })

    if (!user) {
      throw new NotFoundException("No se encontró el usuario")
    }
    user.password = null;
    return user
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<ApiResponse<User>> {
    const user = await this.userRepository.preload({
      id,
      ...updateUserDto
    })
    if (!user) {
      throw new NotFoundException("No se encontró el usuario")
    }

    await this.userRepository.save(user)

    return {
      message: "Usuario actualizado correctamente",
      data: user
    }
  }

  async getBackupCodesRemaining(id: string): Promise<number> {
    const user = await this.userRepository
      .createQueryBuilder("user")
      .addSelect("user.two_factor_backup_codes")
      .where("user.id = :id", { id })
      .getOne();

    return user?.two_factor_backup_codes?.length ?? 0;
  }

  async updateEmail(updateEmailDto: UpdateEmailDto, id: string): Promise<ApiResponse<null>> {
    const user = await this.userRepository.findOne({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException("No se ha encontrado el usuario");
    }

    const existing_email = await this.userRepository.findOne({
      where: { email: updateEmailDto.email },
    });

    if (existing_email && existing_email.id !== id) {
      throw new ConflictException("Ya existe un usuario registrado con ese email");
    }

    await this.userRepository.update(id, {
      email: updateEmailDto.email,
      is_email_verified: false,
    });

    return {
      message: "Email actualizado correctamente",
      data: null,
    };
  }

  async resetPassword(id: string, newPassword: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException("No se ha encontrado el usuario");
    }

    if (user.provider !== "local") {
      throw new UnauthorizedException(
        "Este usuario se autentica con un proveedor externo y no tiene contraseña que restablecer"
      );
    }

    const hashedPassword = await this.passwordService.hashPassword(newPassword);
    await this.userRepository.update(id, { password: hashedPassword });
  }

  async updatePassword(updatePasswordDto: UpdatePasswordDto, id: string): Promise<ApiResponse<null>> {
    const user = await this.userRepository
      .createQueryBuilder("user")
      .addSelect("user.password")
      .where("user.id = :id", { id })
      .getOne();

    if (!user) {
      throw new NotFoundException("No se ha encontrado el usuario");
    }

    if (user.provider !== "local") {
      throw new UnauthorizedException(
        "Este usuario se autentica con un proveedor externo y no tiene contraseña que cambiar",
      );
    }

    if (!user.password) {
      throw new UnauthorizedException("La contraseña ingresada no es correcta");
    }

    const is_valid_password = await this.passwordService.comparePassword(
      updatePasswordDto.current_password,
      user.password,
    );
    if (!is_valid_password) {
      throw new UnauthorizedException("La contraseña ingresada no es correcta");
    }

    const hashed_password = await this.passwordService.hashPassword(
      updatePasswordDto.password,
    );

    await this.userRepository.update(id, {
      password: hashed_password,
    });

    return {
      message: "Contraseña actualizada correctamente",
      data: null,
    };
  }

}