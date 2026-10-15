import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  forwardRef,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { envs } from "@/src/common/envs";
import { FRONTEND_ROUTES } from "@/src/common/frontend-routes";
import { FeaturedListingCreditsService } from "@/src/contexts/billing/services/featured-listing-credits.service";
import { ProfileEntity } from "@/src/contexts/profiles/entities/profile.entity";
import { OutboundMailEnqueueService } from "@/src/contexts/shared/mail/outbound-mail-enqueue.service";
import { User } from "@/src/contexts/users/entities/user.entity";
import { VehicleEntity } from "@/src/contexts/vehicles/entities/vehicle.entity";
import { STATUS_VEHICLE } from "@/src/contexts/vehicles/types/vehicle";

import { ReferralEntity } from "../entities/referral.entity";
import {
  REFERRAL_REWARD_BOOST_WEIGHT,
  REFERRAL_REWARD_DURATION_DAYS,
  REFERRAL_STATUS,
} from "../types/referral-status";
import { generateReferralCode } from "../utils/generate-referral-code";

export interface ReferralMeSummary {
  referral_code: string;
  share_url: string;
  rewarded_count: number;
}

interface AttributeReferralOptions {
  throw_on_invalid?: boolean;
}

@Injectable()
export class ReferralsService {
  private readonly logger = new Logger(ReferralsService.name);

  constructor(
    @InjectRepository(ReferralEntity)
    private readonly referral_repository: Repository<ReferralEntity>,
    @InjectRepository(ProfileEntity)
    private readonly profile_repository: Repository<ProfileEntity>,
    @InjectRepository(VehicleEntity)
    private readonly vehicle_repository: Repository<VehicleEntity>,
    @InjectRepository(User)
    private readonly user_repository: Repository<User>,
    @Inject(forwardRef(() => FeaturedListingCreditsService))
    private readonly featured_listing_credits_service: FeaturedListingCreditsService,
    private readonly outbound_mail_enqueue_service: OutboundMailEnqueueService,
  ) {}

  normalizeReferralCode(code: string | undefined | null): string | null {
    const trimmed = code?.trim();
    if (!trimmed) {
      return null;
    }

    return trimmed.toUpperCase();
  }

  buildShareUrl(referral_code: string): string {
    const base = envs.FRONTEND_URL.replace(/\/$/, "");
    const register_path = FRONTEND_ROUTES.REGISTER;
    const params = new URLSearchParams({ ref: referral_code });
    return `${base}${register_path}?${params.toString()}`;
  }

  async ensureReferralCodeForProfile(profile_id: string): Promise<string> {
    const profile = await this.profile_repository.findOne({
      where: { id: profile_id },
    });

    if (!profile) {
      throw new BadRequestException("Perfil no encontrado");
    }

    if (profile.referral_code) {
      return profile.referral_code;
    }

    for (let attempt = 0; attempt < 8; attempt += 1) {
      const candidate = generateReferralCode();
      const exists = await this.profile_repository.exists({
        where: { referral_code: candidate },
      });
      if (exists) {
        continue;
      }

      const preloaded = await this.profile_repository.preload({
        id: profile_id,
        referral_code: candidate,
      });

      if (!preloaded) {
        throw new BadRequestException("No se pudo asignar el código de invitación");
      }

      await this.profile_repository.save(preloaded);
      return candidate;
    }

    throw new BadRequestException(
      "No se pudo generar un código de invitación único",
    );
  }

  async attributeOnRegister(
    invitee_profile_id: string,
    referral_code: string | undefined | null,
  ): Promise<void> {
    await this.attributeReferral(invitee_profile_id, referral_code, {
      throw_on_invalid: false,
    });
  }

  async attributeReferral(
    invitee_profile_id: string,
    referral_code: string | undefined | null,
    options: AttributeReferralOptions = {},
  ): Promise<void> {
    const normalized = this.normalizeReferralCode(referral_code);
    if (!normalized) {
      if (options.throw_on_invalid) {
        throw new BadRequestException("Código de invitación no válido");
      }
      return;
    }

    const inviter = await this.profile_repository.findOne({
      where: { referral_code: normalized },
    });

    if (!inviter) {
      if (options.throw_on_invalid) {
        throw new BadRequestException("Código de invitación no válido");
      }
      return;
    }

    if (inviter.id === invitee_profile_id) {
      if (options.throw_on_invalid) {
        throw new BadRequestException("No puedes usar tu propio código de invitación");
      }
      return;
    }

    const existing_for_invitee = await this.referral_repository.findOne({
      where: { invitee_profile_id },
    });

    if (existing_for_invitee) {
      return;
    }

    const referral = this.referral_repository.create({
      inviter_profile_id: inviter.id,
      invitee_profile_id,
      status: REFERRAL_STATUS.ATTRIBUTED,
      rewarded_credit_id: null,
      rewarded_at: null,
    });

    await this.referral_repository.save(referral);
  }

  async getReferralMe(profile_id: string): Promise<ReferralMeSummary> {
    const referral_code = await this.ensureReferralCodeForProfile(profile_id);

    const rewarded_count = await this.referral_repository.count({
      where: {
        inviter_profile_id: profile_id,
        status: REFERRAL_STATUS.REWARDED,
      },
    });

    return {
      referral_code,
      share_url: this.buildShareUrl(referral_code),
      rewarded_count,
    };
  }

  async rewardIfEligible(invitee_profile_id: string): Promise<void> {
    const referral = await this.referral_repository.findOne({
      where: {
        invitee_profile_id,
        status: REFERRAL_STATUS.ATTRIBUTED,
      },
    });

    if (!referral) {
      return;
    }

    const active_listings = await this.vehicle_repository.count({
      where: {
        profile_id: invitee_profile_id,
        status: STATUS_VEHICLE.ACTIVE,
      },
    });

    if (active_listings !== 1) {
      return;
    }

    const credit = await this.featured_listing_credits_service.addCredit({
      profile_id: referral.inviter_profile_id,
      duration_days: REFERRAL_REWARD_DURATION_DAYS,
      boost_weight: REFERRAL_REWARD_BOOST_WEIGHT,
      offer_id: null,
      stripe_checkout_session_id: null,
    });

    const preloaded = await this.referral_repository.preload({
      id: referral.id,
      status: REFERRAL_STATUS.REWARDED,
      rewarded_credit_id: credit.id,
      rewarded_at: new Date(),
    });

    if (!preloaded) {
      return;
    }

    await this.referral_repository.save(preloaded);

    const inviter_user = await this.user_repository.findOne({
      where: { id: referral.inviter_profile_id },
    });

    if (!inviter_user?.email) {
      return;
    }

    const listings_url = `${envs.FRONTEND_URL.replace(/\/$/, "")}${FRONTEND_ROUTES.MY_LISTINGS}`;

    try {
      await this.outbound_mail_enqueue_service.enqueue_referral_reward({
        to: inviter_user.email,
        duration_days: REFERRAL_REWARD_DURATION_DAYS,
        listings_url,
      });
    } catch (error) {
      this.logger.error(
        `No se pudo encolar el correo de recompensa por invitación para ${inviter_user.email}`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }
}
