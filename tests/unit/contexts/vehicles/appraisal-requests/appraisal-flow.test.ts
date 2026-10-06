import { ConflictException, ForbiddenException } from "@nestjs/common";
import { beforeEach, describe, expect, it, vi } from "vitest";

// El servicio de precio arrastra la cadena de entidades de vehículos; aquí no hace falta.
vi.mock("@/src/contexts/vehicles/services/recommend-vehicle-price.service", () => ({
  RecommendVehiclePriceService: class {
    execute = vi.fn();
  },
}));

import type { AppraisalOfferEntity } from "@/src/contexts/vehicles/appraisal-requests/entities/appraisal-offer.entity";
import type { AppraisalRequestEntity } from "@/src/contexts/vehicles/appraisal-requests/entities/appraisal-request.entity";
import { AppraisalEstimateService } from "@/src/contexts/vehicles/appraisal-requests/services/appraisal-estimate.service";
import { AppraisalExpirationService } from "@/src/contexts/vehicles/appraisal-requests/services/appraisal-expiration.service";
import { AppraisalOpportunitiesService } from "@/src/contexts/vehicles/appraisal-requests/services/appraisal-opportunities.service";

const NOW = new Date("2026-10-05T12:00:00.000Z");
const FUTURE = new Date("2026-10-12T12:00:00.000Z");

const buildAppraisal = (
  overrides: Partial<AppraisalRequestEntity> = {},
): AppraisalRequestEntity =>
  ({
    id: "appraisal-1",
    make: { name: "SEAT" },
    model: { name: "Ateca" },
    year: { year: 2020 },
    version: { name: "2.0 TDI 150 CV Style", fuel_type: { name: "Diésel" } },
    transmission_type: "manual",
    mileage: 92_000,
    power: 150,
    name: "Ana López",
    email: "ana@example.com",
    phone_code: "+34",
    phone: "600000000",
    profile_id: "seller-1",
    status: "open_for_offers",
    estimated_price_min: 18_200,
    estimated_price_max: 19_800,
    recommended_price: 19_000,
    ai_explanation: "Precio en línea con el mercado.",
    ai_confidence: "medium",
    ai_source: "ai",
    admin_note: null,
    offers_requested_at: NOW,
    offers_expire_at: FUTURE,
    accepted_offer_id: null,
    created_at: NOW,
    ...overrides,
  }) as unknown as AppraisalRequestEntity;

const buildOffer = (overrides: Partial<AppraisalOfferEntity> = {}): AppraisalOfferEntity =>
  ({
    id: "offer-a",
    appraisal_request_id: "appraisal-1",
    dealership_id: "dealer-a",
    amount: 18_500,
    message: null,
    status: "pending",
    created_at: NOW,
    updated_at: NOW,
    dealership: { id: "dealer-a", name: "Concesionario A", slug: "a", avatar_url: null },
    ...overrides,
  }) as unknown as AppraisalOfferEntity;

const buildNotifications = () => ({
  notifyOpportunity: vi.fn(),
  notifySellerNewOffer: vi.fn(),
  notifyDealershipOfferAccepted: vi.fn(),
  notifyDealershipOfferRejected: vi.fn(),
  notifyDealershipsClosed: vi.fn(),
  notifySellerExpired: vi.fn(),
});

describe("AppraisalOpportunitiesService", () => {
  const appraisal_repository = { findOne: vi.fn() };
  const offer_repository = { find: vi.fn(), findOne: vi.fn(), exists: vi.fn(), save: vi.fn(), create: vi.fn(), update: vi.fn() };
  const member_repository = { findOne: vi.fn() };
  const user_repository = { findOne: vi.fn() };
  let notifications: ReturnType<typeof buildNotifications>;
  let service: AppraisalOpportunitiesService;

  beforeEach(() => {
    vi.clearAllMocks();
    notifications = buildNotifications();
    user_repository.findOne.mockResolvedValue({ id: "dealer-user", is_admin: false });
    member_repository.findOne.mockResolvedValue({
      dealership_id: "dealer-a",
      role: "owner",
      dealership: { name: "Concesionario A" },
    });
    service = new AppraisalOpportunitiesService(
      appraisal_repository as never,
      offer_repository as never,
      member_repository as never,
      user_repository as never,
      notifications as never,
    );
  });

  it("no revela el contacto del vendedor mientras la oferta está pendiente", async () => {
    appraisal_repository.findOne.mockResolvedValue(buildAppraisal());
    offer_repository.find.mockResolvedValue([
      buildOffer(),
      buildOffer({ id: "offer-b", dealership_id: "dealer-b", amount: 19_000 }),
    ]);

    const result = await service.findOne("dealer-user", "appraisal-1");

    expect(result.seller_contact).toBeNull();
    expect(result.my_offer).toMatchObject({ id: "offer-a", amount: 18_500 });
    expect(result.offers_count).toBe(2);
  });

  it("revela el contacto solo al concesionario cuya oferta se aceptó", async () => {
    appraisal_repository.findOne.mockResolvedValue(
      buildAppraisal({ status: "offer_accepted", accepted_offer_id: "offer-a" }),
    );
    offer_repository.exists.mockResolvedValue(true);
    offer_repository.find.mockResolvedValue([buildOffer({ status: "accepted" })]);

    const result = await service.findOne("dealer-user", "appraisal-1");

    expect(result.seller_contact).toEqual({
      name: "Ana López",
      email: "ana@example.com",
      phone_code: "+34",
      phone: "600000000",
    });
  });

  it("oculta una tasación cerrada a concesionarios que no ofertaron", async () => {
    appraisal_repository.findOne.mockResolvedValue(
      buildAppraisal({ status: "offer_accepted", accepted_offer_id: "offer-x" }),
    );
    offer_repository.exists.mockResolvedValue(false);

    await expect(service.findOne("dealer-user", "appraisal-1")).rejects.toThrow();
  });

  it("solo owner o admin pueden ofertar", async () => {
    member_repository.findOne.mockResolvedValue({ dealership_id: "dealer-a", role: "member" });

    await expect(
      service.upsertOffer("dealer-user", "appraisal-1", { amount: 18_000 }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("rechaza ofertas en tasaciones vencidas", async () => {
    appraisal_repository.findOne.mockResolvedValue(
      buildAppraisal({ offers_expire_at: new Date("2020-01-01") }),
    );

    await expect(
      service.upsertOffer("dealer-user", "appraisal-1", { amount: 18_000 }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it("permite a un admin de plataforma ver sin membership", async () => {
    user_repository.findOne.mockResolvedValue({ id: "admin-user", is_admin: true });
    member_repository.findOne.mockResolvedValue(null);
    appraisal_repository.findOne.mockResolvedValue(buildAppraisal());
    offer_repository.find.mockResolvedValue([buildOffer()]);

    const result = await service.findOne("admin-user", "appraisal-1");

    expect(result.seller_contact).toBeNull();
    expect(result.my_offer).toBeNull();
    expect(result.offers_count).toBe(1);
  });

  it("permite a un admin de plataforma ver una tasación cerrada aunque no haya ofertado", async () => {
    user_repository.findOne.mockResolvedValue({ id: "admin-user", is_admin: true });
    member_repository.findOne.mockResolvedValue(null);
    appraisal_repository.findOne.mockResolvedValue(
      buildAppraisal({ status: "offer_accepted", accepted_offer_id: "offer-a" }),
    );
    offer_repository.find.mockResolvedValue([buildOffer({ status: "accepted" })]);

    const result = await service.findOne("admin-user", "appraisal-1");

    expect(result.seller_contact).toBeNull();
    expect(offer_repository.exists).not.toHaveBeenCalled();
  });

  it("no deja ofertar a un admin de plataforma sin concesionario", async () => {
    user_repository.findOne.mockResolvedValue({ id: "admin-user", is_admin: true });
    member_repository.findOne.mockResolvedValue(null);

    await expect(
      service.upsertOffer("admin-user", "appraisal-1", { amount: 18_000 }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});

describe("AppraisalEstimateService.acceptOffer", () => {
  it("acepta una oferta, rechaza las demás y avisa a cada concesionario", async () => {
    const appraisal = buildAppraisal();
    const accepted = buildOffer();
    const other = buildOffer({ id: "offer-b", dealership_id: "dealer-b" });
    const manager = {
      findOne: vi.fn().mockResolvedValue(accepted),
      find: vi.fn().mockResolvedValue([accepted, other]),
      update: vi.fn(),
    };
    const appraisal_repository = { findOne: vi.fn().mockResolvedValue(appraisal) };
    const offer_repository = { find: vi.fn().mockResolvedValue([]) };
    const data_source = { transaction: vi.fn((callback) => callback(manager)) };
    const notifications = buildNotifications();

    const service = new AppraisalEstimateService(
      appraisal_repository as never,
      offer_repository as never,
      {} as never,
      {} as never,
      notifications as never,
      data_source as never,
      {} as never,
    );

    await service.acceptOffer("seller-1", "appraisal-1", "offer-a");

    expect(manager.update).toHaveBeenCalledWith(
      expect.anything(),
      ["offer-b"],
      expect.objectContaining({ status: "rejected" }),
    );
    expect(manager.update).toHaveBeenCalledWith(
      expect.anything(),
      "appraisal-1",
      expect.objectContaining({ status: "offer_accepted", accepted_offer_id: "offer-a" }),
    );
    expect(notifications.notifyDealershipOfferAccepted).toHaveBeenCalledWith(appraisal, accepted);
    expect(notifications.notifyDealershipsClosed).toHaveBeenCalledWith(
      appraisal,
      ["dealer-b"],
      "accepted_other",
    );
  });

  it("no permite aceptar si la tasación no está abierta", async () => {
    const service = new AppraisalEstimateService(
      { findOne: vi.fn().mockResolvedValue(buildAppraisal({ status: "estimated" })) } as never,
      {} as never,
      {} as never,
      {} as never,
      buildNotifications() as never,
      {} as never,
      {} as never,
    );

    await expect(
      service.acceptOffer("seller-1", "appraisal-1", "offer-a"),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});

describe("AppraisalEstimateService.requestOffers", () => {
  it("abre la tasación a ofertas y encola el aviso a concesionarios", async () => {
    const appraisal_repository = {
      findOne: vi.fn().mockResolvedValue(buildAppraisal({ status: "estimated" })),
      update: vi.fn(),
    };
    const queue = { add: vi.fn() };
    const service = new AppraisalEstimateService(
      appraisal_repository as never,
      { find: vi.fn().mockResolvedValue([]) } as never,
      {} as never,
      {} as never,
      buildNotifications() as never,
      {} as never,
      queue as never,
    );

    await service.requestOffers("seller-1", "appraisal-1");

    expect(appraisal_repository.update).toHaveBeenCalledWith(
      "appraisal-1",
      expect.objectContaining({ status: "open_for_offers" }),
    );
    expect(queue.add).toHaveBeenCalledWith(
      "notify-opportunity",
      { appraisal_id: "appraisal-1" },
      expect.any(Object),
    );
  });

  it("es idempotente si ya está abierta", async () => {
    const appraisal_repository = {
      findOne: vi.fn().mockResolvedValue(buildAppraisal()),
      update: vi.fn(),
    };
    const queue = { add: vi.fn() };
    const service = new AppraisalEstimateService(
      appraisal_repository as never,
      { find: vi.fn().mockResolvedValue([]) } as never,
      {} as never,
      {} as never,
      buildNotifications() as never,
      {} as never,
      queue as never,
    );

    await service.requestOffers("seller-1", "appraisal-1");

    expect(appraisal_repository.update).not.toHaveBeenCalled();
    expect(queue.add).not.toHaveBeenCalled();
  });
});

describe("AppraisalExpirationService", () => {
  it("vence las tasaciones abiertas, sus ofertas pendientes y avisa a ambas partes", async () => {
    const appraisal = buildAppraisal({ offers_expire_at: new Date("2026-10-01") });
    const appraisal_repository = {
      find: vi.fn().mockResolvedValue([appraisal]),
      update: vi.fn(),
    };
    const offer_repository = {
      find: vi.fn().mockResolvedValue([buildOffer()]),
      update: vi.fn(),
    };
    const notifications = buildNotifications();
    const service = new AppraisalExpirationService(
      appraisal_repository as never,
      offer_repository as never,
      notifications as never,
    );

    const expired = await service.expireDue(NOW);

    expect(expired).toBe(1);
    expect(appraisal_repository.update).toHaveBeenCalledWith("appraisal-1", { status: "expired" });
    expect(offer_repository.update).toHaveBeenCalledWith(
      ["offer-a"],
      expect.objectContaining({ status: "expired" }),
    );
    expect(notifications.notifySellerExpired).toHaveBeenCalledWith(appraisal);
    expect(notifications.notifyDealershipsClosed).toHaveBeenCalledWith(
      appraisal,
      ["dealer-a"],
      "expired",
    );
  });
});
