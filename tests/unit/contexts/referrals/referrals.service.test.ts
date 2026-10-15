import "reflect-metadata";

import { BadRequestException } from "@nestjs/common";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ReferralsService } from "@/src/contexts/referrals/services/referrals.service";
import { REFERRAL_STATUS } from "@/src/contexts/referrals/types/referral-status";
import { STATUS_VEHICLE } from "@/src/contexts/vehicles/types/vehicle";

describe("ReferralsService", () => {
  const inviter_id = "11111111-1111-1111-1111-111111111111";
  const invitee_id = "22222222-2222-2222-2222-222222222222";

  const referral_repository = {
    findOne: vi.fn(),
    create: vi.fn(),
    save: vi.fn(),
    count: vi.fn(),
    preload: vi.fn(),
  };
  const profile_repository = {
    findOne: vi.fn(),
    exists: vi.fn(),
    preload: vi.fn(),
    save: vi.fn(),
  };
  const vehicle_repository = {
    count: vi.fn(),
  };
  const user_repository = {
    findOne: vi.fn(),
  };
  const featured_listing_credits_service = {
    addCredit: vi.fn(),
  };
  const outbound_mail_enqueue_service = {
    enqueue_referral_reward: vi.fn(),
  };

  const createService = () =>
    new ReferralsService(
      referral_repository as never,
      profile_repository as never,
      vehicle_repository as never,
      user_repository as never,
      featured_listing_credits_service as never,
      outbound_mail_enqueue_service as never,
    );

  beforeEach(() => {
    vi.clearAllMocks();
    referral_repository.create.mockImplementation((input: unknown) => input);
    referral_repository.save.mockImplementation(async (input: unknown) => input);
  });

  it("rechaza auto-referral cuando throw_on_invalid", async () => {
    const service = createService();
    profile_repository.findOne.mockResolvedValue({ id: invitee_id });

    await expect(
      service.attributeReferral(invitee_id, "ABC12345", {
        throw_on_invalid: true,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("no crea referral si el código no existe", async () => {
    const service = createService();
    profile_repository.findOne.mockResolvedValue(null);

    await service.attributeReferral(invitee_id, "UNKNOWN1", {
      throw_on_invalid: false,
    });

    expect(referral_repository.save).not.toHaveBeenCalled();
  });

  it("crea referral attributed con código válido", async () => {
    const service = createService();
    profile_repository.findOne.mockResolvedValue({ id: inviter_id });
    referral_repository.findOne.mockResolvedValue(null);

    await service.attributeReferral(invitee_id, "abc12345", {
      throw_on_invalid: false,
    });

    expect(referral_repository.create).toHaveBeenCalledWith({
      inviter_profile_id: inviter_id,
      invitee_profile_id: invitee_id,
      status: REFERRAL_STATUS.ATTRIBUTED,
      rewarded_credit_id: null,
      rewarded_at: null,
    });
    expect(referral_repository.save).toHaveBeenCalled();
  });

  it("otorga cupón solo en el primer anuncio activo", async () => {
    const service = createService();
    const referral = {
      id: "ref-1",
      inviter_profile_id: inviter_id,
      invitee_profile_id: invitee_id,
      status: REFERRAL_STATUS.ATTRIBUTED,
    };

    referral_repository.findOne.mockResolvedValue(referral);
    vehicle_repository.count.mockResolvedValue(2);
    featured_listing_credits_service.addCredit.mockResolvedValue({ id: "credit-1" });

    await service.rewardIfEligible(invitee_id);

    expect(featured_listing_credits_service.addCredit).not.toHaveBeenCalled();
  });

  it("recompensa al invitador cuando hay un solo anuncio activo", async () => {
    const service = createService();
    const referral = {
      id: "ref-1",
      inviter_profile_id: inviter_id,
      invitee_profile_id: invitee_id,
      status: REFERRAL_STATUS.ATTRIBUTED,
    };

    referral_repository.findOne.mockResolvedValue(referral);
    vehicle_repository.count.mockResolvedValue(1);
    featured_listing_credits_service.addCredit.mockResolvedValue({ id: "credit-1" });
    referral_repository.preload.mockResolvedValue({
      ...referral,
      status: REFERRAL_STATUS.REWARDED,
    });
    user_repository.findOne.mockResolvedValue({ email: "inviter@example.com" });

    await service.rewardIfEligible(invitee_id);

    expect(vehicle_repository.count).toHaveBeenCalledWith({
      where: {
        profile_id: invitee_id,
        status: STATUS_VEHICLE.ACTIVE,
      },
    });
    expect(featured_listing_credits_service.addCredit).toHaveBeenCalled();
    expect(outbound_mail_enqueue_service.enqueue_referral_reward).toHaveBeenCalled();
  });
});
