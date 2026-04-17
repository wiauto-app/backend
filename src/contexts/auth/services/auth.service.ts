import { Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";

import { UserService } from "../../users/services/user.service";
import { PasswordService } from "./password.service";
import { LoginDto } from "../dto/login.dto";
import { User } from "../../users/entities/user.entity";
import { OAuthProfile } from "../strategies/google.strategy";
import { SessionPayload } from "../types/auth.types";

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly passwordService: PasswordService,
    private readonly jwtService: JwtService,
  ) {}

  async signIn(loginDto: LoginDto) {
    const user = await this.userService.getUserByEmail({ email: loginDto.email });

    if (!user) {
      throw new NotFoundException("No se ha encontrado el usuario");
    }

    if (user.provider !== "local" || !user.password) {
      throw new UnauthorizedException(
        `Este email está registrado con ${user.provider}. Iniciá sesión con ese proveedor.`,
      );
    }

    const isValidPassword = await this.passwordService.comparePassword(loginDto.password, user.password);

    if (!isValidPassword) {
      throw new UnauthorizedException("El email o la contraseña son incorrectos");
    }

    await this.userService.updateUser(user.id, {
      last_sign_in: new Date(),
    });

    return this.createToken(user);
  }

  async signInWithOAuthProfile(profile: OAuthProfile) {
    if (!profile.email) {
      throw new UnauthorizedException("El proveedor no devolvió un email");
    }

    const user = await this.userService.findOrCreateOAuthUser(profile);
    await this.userService.updateUser(user.id, {
      last_sign_in: new Date(),
    });

    return this.createToken(user);
  }

  private createToken(user: User) {
    const payload:SessionPayload = {
      id: user.id,
      email: user.email,
    };
    return this.jwtService.sign(payload);
  }
}
