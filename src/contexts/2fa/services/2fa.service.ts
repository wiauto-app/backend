import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { generateSecret, generateURI, verify } from "otplib";
import { toDataURL } from "qrcode"
import bcrypt from "bcrypt"

import { UserService } from "../../users/services/user.service";
import { envs } from "@/src/common/envs";
import { CryptoService } from "./crypto.service";
import { TwofaDto } from "../dto/2fa.dto";
import { TwoFactorChallengeResponse, TwoFactorEnableResponse } from "../../auth/types/auth.types";
import { BackupCodeService } from "./backup-code.service";
import { SALT_ROUNDS } from "@/src/common/constants";
import { ValidateBackupCodeDto } from "../dto/validate-backup-code.dto";
import { AuthService } from "../../auth/services/auth.service";
@Injectable()
export class TwoFactorAuthService {
  constructor(
    private readonly userService: UserService,
    private readonly cryptoService: CryptoService,
    private readonly backupCodeService: BackupCodeService,
    private readonly authService: AuthService
  ) { }

  async setup(user_id: string) {
    const user = await this.userService.findOne(user_id);

    if (user.two_factor_enabled) {
      if (user.two_factor_secret) {
        const qr_code_data = await this.getQrCode(user.two_factor_secret, user.email)
        return qr_code_data
      }
      throw new ConflictException("2FA ya está habilitado");
    }
    const secret = generateSecret();


    const cipherSecret = this.cryptoService.encrypt(secret)
    await this.userService.update(user_id, {
      two_factor_secret: cipherSecret,
    })

    const qr_code_data = await this.getQrCode(cipherSecret, user.email)
    return qr_code_data


  }

  async getQrCode(encryptedSecret: string, email: string): Promise<{ otpauth_url: string, qr_code_data_url: string }> {
    const secret = this.cryptoService.decrypt(encryptedSecret)
    const url = generateURI({
      secret,
      issuer: envs.TWO_FACTOR_ISSUER,
      label: email
    })
    return {
      otpauth_url: url,
      qr_code_data_url: await toDataURL(url)
    }
  }

  async activate(id: string): Promise<TwoFactorEnableResponse> {
    const user = await this.userService.findOne(id)

    if (user.two_factor_enabled) {
      throw new ConflictException("2FA ya está habilitado")
    }

    const backup_codes: string[] = [];
    if (!user.two_factor_backup_codes || user.two_factor_backup_codes.length === 0) {

      Array.from({ length: 8 }).map(() => backup_codes.push(this.backupCodeService.generateBackupCode()))

      await this.userService.update(id, {
        two_factor_backup_codes: await Promise.all(backup_codes.map(async (code) => await bcrypt.hash(code, SALT_ROUNDS)))
      })
    }

    await this.userService.update(id, {
      two_factor_enabled: true
    })
    return {
      verified: true,
      message: "Se ha habilitado el autenticador correctamente",
      // user: user,
      backup_codes: backup_codes.length > 0 ? backup_codes : undefined
    }
  }

  async enable(id: string): Promise<{ message: string }> {
    const user = await this.userService.findOne(id)

    if (user.two_factor_enabled) {
      throw new ConflictException("2FA ya está habilitado")
    }

    await this.userService.update(id, {
      two_factor_enabled: true
    })

    return {
      message: "Se ha habilitado el autenticador correctamente",
    }
  }

  async verify(id: string, twofaDto: TwofaDto): Promise<TwoFactorChallengeResponse> {
    const user = await this.userService.findOne(id)
    if (!user.two_factor_secret) {
      throw new ConflictException("La verificación a dos pasos no ha sido activada")
    }

    const rawSecret = this.cryptoService.decrypt(user.two_factor_secret)
    const { valid } = await verify({
      secret: rawSecret,
      token: twofaDto.code
    })

    if (!valid) {
      throw new BadRequestException("Código incorrecto")
    }


    return {
      verified: true,
      user: user,
      message: "Código verificado correctamente"
    }
  }

  async disable(id: string): Promise<{ message: string }> {
    await this.userService.update(id, {
      two_factor_enabled: false
    })
    return {
      message: "Se ha deshabilitado el autenticador correctamente",
    }
  }

  async delete(id: string): Promise<{ message: string }> {

    await this.userService.update(id, {
      two_factor_secret: null,
      two_factor_enabled: false,
    })
    return {
      message: "Se ha eliminado el autenticador correctamente",
    }
  }

  async validateBackupCode(dto: ValidateBackupCodeDto): Promise<{ message: string, token: string }> {
    const user = await this.userService.getUserByEmail({ email: dto.email })

    if (!user.two_factor_backup_codes || user.two_factor_backup_codes.length === 0) {
      throw new NotFoundException("No se encontraron códigos de respaldo")
    }

    const validationCodes = await Promise.all(user.two_factor_backup_codes.map(async (code) => ({
      code,
      isValid: await bcrypt.compare(dto.code, code)
    })))


    const isValid = validationCodes.some(({ isValid }) => isValid)
    if (!isValid) {
      throw new BadRequestException("Código de respaldo incorrecto")
    }

    const validCode = validationCodes.find(({ isValid }) => isValid)

    const newValidationCodes = user.two_factor_backup_codes.filter((code) => code !== validCode?.code)
    await this.userService.update(user.id, {
      two_factor_backup_codes: newValidationCodes
    })

    const token = this.authService.createToken(user, "30d")

    return {
      message: "Código de respaldo validado correctamente",
      token: token
    }
  }

  async regenerateBackupCodes(id: string): Promise<{ message: string, backup_codes: string[] }> {
    const user = await this.userService.findOne(id)
    const totalBackupCodes = 8
    const currentBackupCodes = user.two_factor_backup_codes?.length
    const backupCodesToGenerate = totalBackupCodes - (currentBackupCodes ?? 0)
    const backup_codes: string[] = [];
    Array.from({ length: backupCodesToGenerate }).map(() => backup_codes.push(this.backupCodeService.generateBackupCode()))
    await this.userService.update(id, {
      two_factor_backup_codes: await Promise.all(backup_codes.map(async (code) => await bcrypt.hash(code, SALT_ROUNDS)))
    })
    
    return {
      message: "Códigos de respaldo regenerados correctamente",
      backup_codes: backup_codes
    }
  }

  /*
 
   "backup_codes": [
         "KNSQ-SMS8",
         "N56N-HQHV",
         "BX23-G2WL",
         "ZAA3-Y5ZC",
         "JDRG-3MN9",
         "DFA5-2GYN"
     ]
 */
}