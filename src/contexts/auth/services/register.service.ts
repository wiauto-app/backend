import { Injectable } from "@nestjs/common";
import { Request } from "express";

import { ApiResponse } from "@/src/common/types/default.types";
import { CreateVehicleService } from "@/src/contexts/vehicles/api/v1/create-vehicle/create-vehicle.service";
import { TempUploadService } from "@/src/contexts/vehicles/vehicle-images/services/temp-upload.service";
import { ReferralsService } from "@/src/contexts/referrals/services/referrals.service";
import { User } from "../../users/entities/user.entity";
import { UserService } from "../../users/services/user.service";
import { RegisterDto } from "../dto/register.dto";
import { SignInResult } from "../types/auth.types";
import { AuthSecurityMailService } from "./auth-security-mail.service";
import { AuthSessionService } from "./auth-session.service";

export interface RegisterApiResponse extends ApiResponse<User> {
  type: SignInResult["type"];
  token: string;
  refresh_token: string;
  referral_code?: string;
  pending_vehicle_id?: string;
  pending_vehicle_error?: string;
}

@Injectable()
export class RegisterService {
  constructor(
    private readonly userService: UserService,
    private readonly authSecurityMailService: AuthSecurityMailService,
    private readonly referrals_service: ReferralsService,
    private readonly create_vehicle_service: CreateVehicleService,
    private readonly temp_upload_service: TempUploadService,
    private readonly auth_session_service: AuthSessionService,
  ) {}

  async register(
    registerDto: RegisterDto,
    guest_id: string | null = null,
    request: Request,
  ): Promise<RegisterApiResponse> {
    const result = await this.userService.create({
      email: registerDto.email,
      password: registerDto.password,
      name: registerDto.name,
      last_name: registerDto.last_name,
      phone_code: registerDto.phone_code,
      phone: registerDto.phone,
      referral_code: registerDto.referral_code,
    });

    this.authSecurityMailService.enqueueNewUserRegistered({
      email: registerDto.email,
      name: registerDto.name,
      last_name: registerDto.last_name,
      phone_code: registerDto.phone_code,
      phone: registerDto.phone,
      created_at: result.data?.created_at,
    });

    const user = result.data;
    const user_id = user?.id;
    let referral_code: string | undefined;
    let pending_vehicle_id: string | undefined;
    let pending_vehicle_error: string | undefined;

    if (user_id) {
      referral_code = await this.referrals_service.ensureReferralCodeForProfile(
        user_id,
      );

      if (referral_code) {
        this.authSecurityMailService.enqueueReferralInvite({
          to: registerDto.email,
          name: registerDto.name,
          referral_code,
          share_url: this.referrals_service.buildShareUrl(referral_code),
        });
      }

      if (registerDto.pending_vehicle) {
        try {
          const guest_id_from_uploads =
            await this.temp_upload_service.resolveGuestIdFromVehicleImages(
              registerDto.pending_vehicle.images,
            );
          const effective_guest_id = guest_id_from_uploads ?? guest_id;

          const created = await this.create_vehicle_service.create(
            registerDto.pending_vehicle,
            user_id,
            effective_guest_id,
            { as_draft: false },
          );
          pending_vehicle_id = created.id;
        } catch (error: unknown) {
          pending_vehicle_error =
            error instanceof Error
              ? error.message
              : "No se pudo publicar el anuncio";
        }
      }
    }

    if (!user) {
      throw new Error("No se pudo crear el usuario");
    }

    const session = await this.auth_session_service.establishSessionForUser(
      user,
      request,
    );

    return {
      ...result,
      ...session,
      referral_code,
      pending_vehicle_id,
      pending_vehicle_error,
    };
  }
}
