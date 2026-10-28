import { Injectable } from "@nestjs/common";

import { ApiResponse } from "@/src/common/types/default.types";
import { PendingVehicleCreationEnqueueService } from "@/src/contexts/vehicles/services/pending-vehicle-creation-enqueue.service";
import { ReferralsService } from "@/src/contexts/referrals/services/referrals.service";
import { User } from "../../users/entities/user.entity";
import { UserService } from "../../users/services/user.service";
import { RegisterDto } from "../dto/register.dto";
import { AuthSecurityMailService } from "./auth-security-mail.service";
import { CreateVehicleDto } from "../../vehicles/api/v1/create-vehicle/create-vehicle.http-dto";

export interface RegisterApiResponse extends ApiResponse<User> {
  referral_code?: string;
  /** El anuncio se está guardando en segundo plano. */
  pending_vehicle_queued?: boolean;
  pending_vehicle_error?: string;
}

@Injectable()
export class RegisterService {
  constructor(
    private readonly userService: UserService,
    private readonly authSecurityMailService: AuthSecurityMailService,
    private readonly referrals_service: ReferralsService,
    private readonly pending_vehicle_creation_enqueue_service: PendingVehicleCreationEnqueueService,
  ) {}

  async register(
    registerDto: RegisterDto,
    guest_id: string | null = null,
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

    const user_id = result.data?.id;
    let referral_code: string | undefined;
    let pending_vehicle_queued: boolean | undefined;
    let pending_vehicle_error: string | undefined;

    if (user_id) {
      referral_code = await this.referrals_service.ensureReferralCodeForProfile(
        user_id,
      );

      if (registerDto.pending_vehicle) {
        try {
          await this.pending_vehicle_creation_enqueue_service.enqueueForProfile(
            user_id,
            guest_id,
            registerDto.pending_vehicle as CreateVehicleDto,
          );
          pending_vehicle_queued = true;
        } catch (error: unknown) {
          pending_vehicle_error =
            error instanceof Error
              ? error.message
              : "No se pudo encolar el anuncio como borrador";
        }
      }
    }

    return {
      ...result,
      referral_code,
      pending_vehicle_queued,
      pending_vehicle_error,
    };
  }
}
