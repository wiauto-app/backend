import { describe, expect, it, vi } from "vitest";
import type { Request } from "express";

vi.mock("@/src/contexts/users/services/user.service", () => ({
  UserService: vi.fn(),
}));
vi.mock("@/src/contexts/auth/services/auth-security-mail.service", () => ({
  AuthSecurityMailService: vi.fn(),
}));
vi.mock("@/src/contexts/referrals/services/referrals.service", () => ({
  ReferralsService: vi.fn(),
}));
vi.mock(
  "@/src/contexts/vehicles/api/v1/create-vehicle/create-vehicle.service",
  () => ({
    CreateVehicleService: vi.fn(),
  }),
);
vi.mock(
  "@/src/contexts/vehicles/vehicle-images/services/temp-upload.service",
  () => ({
    TempUploadService: vi.fn(),
  }),
);
vi.mock("@/src/contexts/auth/services/auth-session.service", () => ({
  AuthSessionService: vi.fn(),
}));

import { RegisterService } from "@/src/contexts/auth/services/register.service";
import { STATUS_VEHICLE } from "@/src/contexts/vehicles/types/vehicle";

describe("RegisterService", () => {
  const baseDto = {
    email: "test@example.com",
    password: "secret12",
    name: "Test",
    last_name: "User",
    phone_code: "+34",
    phone: "600000000",
  };

  const request = { ip: "127.0.0.1", headers: {} } as Request;

  const sessionResult = {
    type: "session" as const,
    token: "jwt-access",
    refresh_token: "refresh-hash",
  };

  const buildService = (overrides: Partial<Record<string, unknown>> = {}) => {
    const userService = {
      create: vi.fn().mockResolvedValue({
        message: "Te enviamos un correo con el enlace de verificación.",
        data: {
          id: "user-1",
          created_at: new Date(),
          email: baseDto.email,
          is_email_verified: false,
        },
      }),
      ...(overrides.userService as object),
    };
    const referrals_service = {
      ensureReferralCodeForProfile: vi.fn().mockResolvedValue("ref-code"),
      buildShareUrl: vi
        .fn()
        .mockReturnValue("https://wiauto.test/publicar?ref=ref-code"),
      ...(overrides.referrals_service as object),
    };
    const create_vehicle_service = {
      create: vi.fn().mockResolvedValue({
        id: "vehicle-1",
        status: STATUS_VEHICLE.ACTIVE,
      }),
      ...(overrides.create_vehicle_service as object),
    };
    const temp_upload_service = {
      resolveGuestIdFromVehicleImages: vi.fn().mockResolvedValue(null),
      ...(overrides.temp_upload_service as object),
    };
    const authSecurityMailService = {
      enqueueNewUserRegistered: vi.fn(),
      enqueueReferralInvite: vi.fn(),
      ...(overrides.authSecurityMailService as object),
    };
    const auth_session_service = {
      establishSessionForUser: vi
        .fn()
        .mockResolvedValue(sessionResult),
      ...(overrides.auth_session_service as object),
    };

    const service = new RegisterService(
      userService as never,
      authSecurityMailService as never,
      referrals_service as never,
      create_vehicle_service as never,
      temp_upload_service as never,
      auth_session_service as never,
    );

    return {
      service,
      authSecurityMailService,
      referrals_service,
      create_vehicle_service,
      temp_upload_service,
      auth_session_service,
      userService,
    };
  };

  it("encola el correo de invitación con el código de referido", async () => {
    const { service, authSecurityMailService, referrals_service } =
      buildService();

    await service.register(baseDto, null, request);

    expect(referrals_service.ensureReferralCodeForProfile).toHaveBeenCalledWith(
      "user-1",
    );
    expect(referrals_service.buildShareUrl).toHaveBeenCalledWith("ref-code");
    expect(authSecurityMailService.enqueueReferralInvite).toHaveBeenCalledWith({
      to: baseDto.email,
      name: baseDto.name,
      referral_code: "ref-code",
      share_url: "https://wiauto.test/publicar?ref=ref-code",
    });
  });

  it("establece sesión y devuelve tokens tras el registro", async () => {
    const { service, auth_session_service, userService } = buildService();
    const user = {
      id: "user-1",
      email: baseDto.email,
      is_email_verified: false,
    };
    userService.create.mockResolvedValue({
      message: "Te enviamos un correo con el enlace de verificación.",
      data: user,
    });

    const response = await service.register(baseDto, null, request);

    expect(auth_session_service.establishSessionForUser).toHaveBeenCalledWith(
      user,
      request,
    );
    expect(response.type).toBe("session");
    expect(response.token).toBe("jwt-access");
    expect(response.refresh_token).toBe("refresh-hash");
  });

  it("publica pending_vehicle como active y devuelve pending_vehicle_id", async () => {
    const { service, create_vehicle_service, temp_upload_service } =
      buildService();
    const pending_vehicle = { price: 10000, mileage: 1000 } as never;

    const response = await service.register(
      { ...baseDto, pending_vehicle },
      "guest-1",
      request,
    );

    expect(
      temp_upload_service.resolveGuestIdFromVehicleImages,
    ).toHaveBeenCalledWith(pending_vehicle.images);
    expect(create_vehicle_service.create).toHaveBeenCalledWith(
      pending_vehicle,
      "user-1",
      "guest-1",
      { as_draft: false },
    );
    expect(response.pending_vehicle_id).toBe("vehicle-1");
    expect(response.pending_vehicle_error).toBeUndefined();
  });

  it("no falla el registro si la publicación del anuncio falla", async () => {
    const { service, auth_session_service } = buildService({
      create_vehicle_service: {
        create: vi.fn().mockRejectedValue(new Error("Catálogo no disponible")),
      },
    });

    const response = await service.register(
      { ...baseDto, pending_vehicle: { price: 1 } as never },
      null,
      request,
    );

    expect(response.message).toContain("verificación");
    expect(response.pending_vehicle_error).toContain("Catálogo");
    expect(response.pending_vehicle_id).toBeUndefined();
    expect(auth_session_service.establishSessionForUser).toHaveBeenCalled();
  });
});
