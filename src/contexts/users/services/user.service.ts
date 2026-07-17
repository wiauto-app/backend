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

import { VehicleEntity } from "../../vehicles/entities/vehicle.entity";
import { User } from "../entities/user.entity";
import { OAuthProvider } from "../entities/user-auth-provider.entity";
import { RegisterUserDto } from '../dto/register-user.dto'
import { PasswordService } from "../../auth/services/password.service";
import { UpdateEmailDto } from "../dto/update-email.dto";
import { ApiResponse } from "@/src/common/types/default.types";
import { UpdatePasswordDto } from "../dto/update-password.dto";
import { GetUserByEmailDto } from "../dto/get-user-by-email.dto";
import { ProfileService } from "../../profiles/services/profile.service";
import { UpdateUserDto } from "../dto/update-user.dto";
import { EmailVerificationService } from "../../auth/services/email-verification.service";
import { TypeOrmProfileRepository } from "@/src/contexts/profiles/repositories/typeorm.profile-repository";
import { UserAuthProviderService } from "./user-auth-provider.service";
import { authResponseConfig } from "../../auth/response.config";

interface FindOrCreateOAuthUserProfile {
  provider: OAuthProvider;
  provider_id: string;
  email?: string | null;
  first_name: string;
  last_name?: string | null;
  role_id: string;
}

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
    private readonly profileRepository: TypeOrmProfileRepository,
    private readonly userAuthProviderService: UserAuthProviderService,
    @Inject(forwardRef(() => EmailVerificationService))
    private readonly emailVerificationService: EmailVerificationService,
  ) { }

  async create(registerUserDto: RegisterUserDto): Promise<ApiResponse<User>> {
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
    return {
      message: "Te enviamos un correo con el enlace de verificación.",
      data: user,
    };
  }

  async findOrCreateOAuthUser(
    profile: FindOrCreateOAuthUserProfile,
  ): Promise<User> {
    const existingByProvider = await this.userAuthProviderService.findByProvider(
      profile.provider,
      profile.provider_id,
    );
    if (existingByProvider) {
      return existingByProvider;
    }

    const email = profile.email?.trim();
    if (!email) {
      throw new UnauthorizedException(
        authResponseConfig.messages.OAUTH_EMAIL_REQUIRED,
      );
    }

    const existingByEmail = await this.userRepository.findOne({
      where: { email },
      relations: ["profile", "profile.role"],
    });

    if (existingByEmail) {
      await this.userAuthProviderService.linkProvider(
        existingByEmail.id,
        profile.provider,
        profile.provider_id,
      );
      return existingByEmail;
    }

    const created = this.userRepository.create({
      email,
      password: null,
      is_email_verified: true,
    });
    const saved = await this.userRepository.save(created);
    await this.profileService.createProfile({
      id: saved.id,
      name: profile.first_name,
      last_name: profile.last_name ?? undefined,
      role_id: profile.role_id,
    });
    await this.userAuthProviderService.linkProvider(
      saved.id,
      profile.provider,
      profile.provider_id,
    );
    saved.password = null;
    return saved;
  }

  async getUserByEmail(getUserByEmailDto: GetUserByEmailDto): Promise<User> {
    const user = await this.userRepository.findOne({
      where: {
        email: getUserByEmailDto.email
      },
      ...(getUserByEmailDto.selectPrivateFields && { select: ["id", "email", "last_sign_in", "is_email_verified", "two_factor_enabled", "two_factor_secret", "two_factor_backup_codes", "created_at", "password"] })
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
      select: ["id", "email", "last_sign_in", "is_email_verified", "two_factor_enabled", "two_factor_secret", "two_factor_backup_codes", "created_at", "password", "is_suspended"],
      relations: ["profile", "profile.role"]
    })
    if (!user) {
      throw new NotFoundException("No se encontró el usuario")
    }
    return user
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
      ...(selectPrivateFields && { select: ["id", "email", "last_sign_in", "is_email_verified", "two_factor_enabled", "two_factor_secret", "two_factor_backup_codes", "created_at", "password"] }),
      relations: ["profile", "profile.role", "profile.vehicle_lists", "profile.vehicle_lists.items"]
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
    const user = await this.userRepository
      .createQueryBuilder("user")
      .addSelect("user.password")
      .where("user.id = :id", { id })
      .getOne();

    if (!user) {
      throw new NotFoundException("No se ha encontrado el usuario");
    }

    if (!user.password) {
      throw new UnauthorizedException(
        "Este usuario se autentica con un proveedor externo y no tiene contraseña que restablecer"
      );
    }

    const hashedPassword = await this.passwordService.hashPassword(newPassword);
    const updated = await this.userRepository.preload({
      id,
      password: hashedPassword,
    });
    if (!updated) {
      throw new NotFoundException("No se ha encontrado el usuario");
    }
    await this.userRepository.save(updated);
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

    if (!user.password) {
      throw new UnauthorizedException(
        "Este usuario se autentica con un proveedor externo y no tiene contraseña que cambiar",
      );
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

    const updated = await this.userRepository.preload({
      id,
      password: hashed_password,
    });
    if (!updated) {
      throw new NotFoundException("No se ha encontrado el usuario");
    }
    await this.userRepository.save(updated);

    return {
      message: "Contraseña actualizada correctamente",
      data: null,
    };
  }

}
