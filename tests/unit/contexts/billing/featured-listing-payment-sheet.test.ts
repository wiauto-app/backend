import "reflect-metadata";

import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from "@nestjs/common";
import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { CreateFeaturedListingPaymentSheetHttpDto } from "@/src/contexts/billing/api/user/create-featured-listing-payment-sheet/create-featured-listing-payment-sheet.http-dto";
import { BillingCheckoutService } from "@/src/contexts/billing/services/billing-plans.service";
import { ONE_TIME_PRODUCT_KIND } from "@/src/contexts/billing/types/billing.enums";
import { STATUS_VEHICLE } from "@/src/contexts/vehicles/types/vehicle";

const profile_id = "14f04126-a751-4cc0-851a-dfc5c9bf98b0";
const other_profile_id = "99999999-a751-4cc0-851a-dfc5c9bf98b0";
const offer_id = "223ac813-eb7e-4c0e-9dc4-f8d89c365286";
const vehicle_id = "56aa4e9f-19cc-49aa-bb01-50a23c410f46";
const customer_id = "cus_test_123";

describe("CreateFeaturedListingPaymentSheetHttpDto", () => {
  it("acepta offer_id con y sin vehicle_id", async () => {
    const with_vehicle = plainToInstance(
      CreateFeaturedListingPaymentSheetHttpDto,
      { offer_id, vehicle_id },
    );
    const without_vehicle = plainToInstance(
      CreateFeaturedListingPaymentSheetHttpDto,
      { offer_id },
    );

    expect(await validate(with_vehicle)).toHaveLength(0);
    expect(await validate(without_vehicle)).toHaveLength(0);
  });

  it("rechaza ids que no son UUID", async () => {
    const dto = plainToInstance(CreateFeaturedListingPaymentSheetHttpDto, {
      offer_id: "x",
      vehicle_id: "y",
    });

    const properties = (await validate(dto)).map((error) => error.property);
    expect(properties).toEqual(
      expect.arrayContaining(["offer_id", "vehicle_id"]),
    );
  });
});

describe("BillingCheckoutService featured listing", () => {
  const now = new Date("2026-09-19T10:00:00.000Z");

  const billing_profile_repository = {
    findById: vi.fn(),
    updateStripeCustomerId: vi.fn(),
  };
  const stripe_client = {
    createCustomer: vi.fn(),
    updateCustomerPreferredLocales: vi.fn(),
    createOneTimePaymentIntent: vi.fn(),
    createCustomerSession: vi.fn(),
    createOneTimeCheckout: vi.fn(),
  };
  const featured_listing_offers_service = { findOne: vi.fn() };
  const vehicle_repository = { findOne: vi.fn() };

  const createService = () =>
    new BillingCheckoutService(
      {} as never,
      billing_profile_repository as never,
      stripe_client as never,
      {} as never,
      {} as never,
      featured_listing_offers_service as never,
      {} as never,
      {} as never,
      {} as never,
      vehicle_repository as never,
    );

  const buildVehicle = (overrides: Record<string, unknown> = {}) => ({
    id: vehicle_id,
    profile_id,
    status: STATUS_VEHICLE.ACTIVE,
    is_featured: false,
    featured_expires_at: null,
    ...overrides,
  });

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(now);

    featured_listing_offers_service.findOne.mockResolvedValue({
      id: offer_id,
      is_active: true,
      amount_cents: 1499,
      currency: "EUR",
      duration_days: 7,
      stripe_price_id: "price_offer",
    });
    vehicle_repository.findOne.mockResolvedValue(buildVehicle());
    billing_profile_repository.findById.mockResolvedValue({
      id: profile_id,
      email: "user@example.com",
      name: "Usuario",
      stripe_customer_id: customer_id,
    });
    stripe_client.createOneTimePaymentIntent.mockResolvedValue({
      id: "pi_123",
      client_secret: "pi_123_secret_abc",
      amount: 1499,
      currency: "eur",
    });
    stripe_client.createCustomerSession.mockResolvedValue("cuss_secret_123");
    stripe_client.createOneTimeCheckout.mockResolvedValue("https://checkout");
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("createFeaturedListingPaymentSheet", () => {
    it("crea el PaymentIntent con la metadata que consume el webhook", async () => {
      const result = await createService().createFeaturedListingPaymentSheet(
        profile_id,
        { offer_id, vehicle_id },
      );

      expect(result).toEqual({
        intent_type: "payment",
        client_secret: "pi_123_secret_abc",
        customer_session_client_secret: "cuss_secret_123",
        customer_id,
        payment_intent_id: "pi_123",
        amount_cents: 1499,
        currency: "eur",
      });

      const window = Math.floor(now.getTime() / 60_000);
      expect(stripe_client.createOneTimePaymentIntent).toHaveBeenCalledWith({
        amount_cents: 1499,
        currency: "eur",
        customer_id,
        description: "Destacado 7 días",
        metadata: {
          profile_id,
          product_kind: ONE_TIME_PRODUCT_KIND.FEATURED_LISTING_OFFER,
          product_id: offer_id,
          checkout_source: "payment_sheet",
          vehicle_id,
        },
        idempotency_key: `featured-ps:${profile_id}:${offer_id}:${vehicle_id}:${window}`,
      });
      expect(stripe_client.createCustomerSession).toHaveBeenCalledWith({
        customer_id,
      });
    });

    it("sin vehicle_id no consulta el anuncio y no envía vehicle_id (crédito)", async () => {
      await createService().createFeaturedListingPaymentSheet(profile_id, {
        offer_id,
      });

      expect(vehicle_repository.findOne).not.toHaveBeenCalled();
      const call = stripe_client.createOneTimePaymentIntent.mock.calls[0][0];
      expect(call.metadata).not.toHaveProperty("vehicle_id");
      expect(call.idempotency_key).toContain(":credit:");
    });

    it("rechaza oferta inactiva", async () => {
      featured_listing_offers_service.findOne.mockResolvedValue({
        id: offer_id,
        is_active: false,
        amount_cents: 1499,
        currency: "eur",
        duration_days: 7,
      });

      await expect(
        createService().createFeaturedListingPaymentSheet(profile_id, {
          offer_id,
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(stripe_client.createOneTimePaymentIntent).not.toHaveBeenCalled();
    });

    it("rechaza oferta sin importe", async () => {
      featured_listing_offers_service.findOne.mockResolvedValue({
        id: offer_id,
        is_active: true,
        amount_cents: 0,
        currency: "eur",
        duration_days: 7,
      });

      await expect(
        createService().createFeaturedListingPaymentSheet(profile_id, {
          offer_id,
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it("404 si el anuncio no existe", async () => {
      vehicle_repository.findOne.mockResolvedValue(null);

      await expect(
        createService().createFeaturedListingPaymentSheet(profile_id, {
          offer_id,
          vehicle_id,
        }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it("403 si el anuncio no es del usuario", async () => {
      vehicle_repository.findOne.mockResolvedValue(
        buildVehicle({ profile_id: other_profile_id }),
      );

      await expect(
        createService().createFeaturedListingPaymentSheet(profile_id, {
          offer_id,
          vehicle_id,
        }),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(stripe_client.createOneTimePaymentIntent).not.toHaveBeenCalled();
    });

    it("409 si el anuncio no está activo", async () => {
      vehicle_repository.findOne.mockResolvedValue(
        buildVehicle({ status: STATUS_VEHICLE.PENDING }),
      );

      const promise = createService().createFeaturedListingPaymentSheet(
        profile_id,
        { offer_id, vehicle_id },
      );
      await expect(promise).rejects.toBeInstanceOf(ConflictException);
      await expect(promise).rejects.toThrow(
        "El anuncio debe estar activo para destacarlo",
      );
    });

    it("409 si el anuncio ya está destacado", async () => {
      vehicle_repository.findOne.mockResolvedValue(
        buildVehicle({
          is_featured: true,
          featured_expires_at: new Date(now.getTime() + 86_400_000),
        }),
      );

      const promise = createService().createFeaturedListingPaymentSheet(
        profile_id,
        { offer_id, vehicle_id },
      );
      await expect(promise).rejects.toBeInstanceOf(ConflictException);
      await expect(promise).rejects.toThrow("El anuncio ya está destacado");
    });

    it("permite destacar si el destacado anterior expiró", async () => {
      vehicle_repository.findOne.mockResolvedValue(
        buildVehicle({
          is_featured: true,
          featured_expires_at: new Date(now.getTime() - 1000),
        }),
      );

      await expect(
        createService().createFeaturedListingPaymentSheet(profile_id, {
          offer_id,
          vehicle_id,
        }),
      ).resolves.toMatchObject({ payment_intent_id: "pi_123" });
    });

    it("traduce idempotency_key_in_use a 409", async () => {
      stripe_client.createOneTimePaymentIntent.mockRejectedValue({
        code: "idempotency_key_in_use",
      });

      await expect(
        createService().createFeaturedListingPaymentSheet(profile_id, {
          offer_id,
        }),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe("createOneTimeCheckout con offer_id + metadata.vehicle_id", () => {
    it("valida ownership antes de crear la sesión", async () => {
      vehicle_repository.findOne.mockResolvedValue(
        buildVehicle({ profile_id: other_profile_id }),
      );

      await expect(
        createService().createOneTimeCheckout(profile_id, {
          offer_id,
          metadata: { vehicle_id },
        }),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(stripe_client.createOneTimeCheckout).not.toHaveBeenCalled();
    });

    it("409 si el anuncio no se puede destacar", async () => {
      vehicle_repository.findOne.mockResolvedValue(
        buildVehicle({ status: STATUS_VEHICLE.INACTIVE }),
      );

      await expect(
        createService().createOneTimeCheckout(profile_id, {
          offer_id,
          metadata: { vehicle_id },
        }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it("400 si vehicle_id no es UUID", async () => {
      await expect(
        createService().createOneTimeCheckout(profile_id, {
          offer_id,
          metadata: { vehicle_id: "nope" },
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(vehicle_repository.findOne).not.toHaveBeenCalled();
    });

    it("sin vehicle_id sigue creando el checkout (crédito)", async () => {
      await expect(
        createService().createOneTimeCheckout(profile_id, { offer_id }),
      ).resolves.toEqual({ checkout_url: "https://checkout" });
      expect(vehicle_repository.findOne).not.toHaveBeenCalled();
    });
  });
});
