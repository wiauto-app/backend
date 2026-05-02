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

import { AuthProvider, User } from "../entities/user.entity";
import { CreateUserDto } from '../dto/create-user.dto'
import { PasswordService } from "../../auth/services/password.service";
import { UpdateEmailDto } from "../dto/update-email.dto";
import { ApiResponse } from "@/src/common/types/default.types";
import { UpdatePasswordDto } from "../dto/update-password.dto";
import { GetUserByEmailDto } from "../dto/get-user-by-email.dto";
import { ProfileService } from "../../profiles/services/profile.service";
import { UpdateUserDto } from "../dto/update-user.dto";
import { EmailVerificationService } from "../../auth/services/email-verification.service";

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly passwordService: PasswordService,
    private readonly profileService: ProfileService,
    @Inject(forwardRef(() => EmailVerificationService))
    private readonly emailVerificationService: EmailVerificationService,
  ) { }

  async create(createUserDto: CreateUserDto): Promise<ApiResponse<User>> {

    const existingUser = await this.userRepository.findOne({
      where: {
        email: createUserDto.email
      }
    })

    if (existingUser) {
      throw new ConflictException("Ya existe un usuario registrado con ese email")
    }

    const hashedPassword = await this.passwordService.hashPassword(createUserDto.password)

    const createdUser = this.userRepository.create({
      email: createUserDto.email,
      password: hashedPassword,
    })
    const user = await this.userRepository.save(createdUser)
    await this.profileService.createProfile({
      id: user.id,
      name: createUserDto.name,
      last_name: createUserDto.last_name,
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
    first_name?: string | null;
    last_name?: string | null;
  }): Promise<User> {
    const existing = await this.userRepository.findOne({ where: { email: profile.email } });

    if (existing) {
      const shouldLink = existing.provider === "local" || existing.provider_id !== profile.provider_id;
      if (shouldLink) {
        existing.provider = profile.provider;
        existing.provider_id = profile.provider_id;
        await this.userRepository.save(existing);
        await this.profileService.fillMissingNames(existing.id, {
          name: profile.first_name ?? null,
          last_name: profile.last_name ?? null,
        });
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
      name: profile.first_name ?? undefined,
      last_name: profile.last_name ?? undefined,
    });
    saved.password = null;
    return saved;
  }

  async getUserByEmail(getUserByEmailDto: GetUserByEmailDto): Promise<User> {
    const user = await this.userRepository.findOne({
      where: {
        email: getUserByEmailDto.email
      }
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

  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: {
        id
      }
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
    user.password = null;

    return {
      message: "Usuario actualizado correctamente",
      data: user
    }
  }

  async updateEmail(updateEmailDto: UpdateEmailDto, id: string): Promise<ApiResponse<null>> {
    const user = await this.userRepository.findOne({
      where: { id }
    })

    if (!user) {
      throw new NotFoundException("No se ha encontrado el usuario")
    }

    await this.userRepository.update(id, {
      email: updateEmailDto.email,
      is_email_verified: false,
    });
    user.password = null;

    return {
      message: "Email actualizado correctamente",
      data: null
    }
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
    const user = await this.userRepository.findOne({
      where: { id }
    })

    if (!user) {
      throw new NotFoundException("No se ha encontrado el usuario")
    }

    const isValidPassword = await this.passwordService.comparePassword(updatePasswordDto.current_password, user.password as unknown as string)
    if (!isValidPassword) {
      throw new UnauthorizedException("La contraseña ingresada no es correcta")
    }

    const hashedPassword = await this.passwordService.hashPassword(updatePasswordDto.password)

    await this.userRepository.update(id, {
      password: hashedPassword
    })

    return {
      message: "Email actualizado correctamente",
      data: null
    }
  }

}