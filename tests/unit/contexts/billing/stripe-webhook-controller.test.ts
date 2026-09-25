import {
  BadRequestException,
  ConflictException,
  INestApplication,
} from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock(
  "@/src/contexts/vehicles/repositories/typeorm.vehicle-repository",
  () => ({
    TypeOrmVehicleRepository: class TypeOrmVehicleRepository {
      readonly mocked = true;
    },
  }),
);

import { StripeWebhookController } from "@/src/contexts/billing/api/user/stripe-webhook/stripe-webhook.controller";
import { V1_BILLING_WEBHOOKS_STRIPE } from "@/src/contexts/billing/api/route.constants";
import { StripeWebhookService } from "@/src/contexts/billing/services/stripe-webhook.service";
import { HttpErrorFilter } from "@/src/contexts/shared/exceptions/HttpErrorFilter";
import { ResponseInterceptor } from "@/src/contexts/shared/interceptors/response.interceptor";

describe("StripeWebhookController HTTP status", () => {
  const webhook_service = { handle: vi.fn() };
  let app: INestApplication;

  const post = () =>
    request(app.getHttpServer())
      .post(`/${V1_BILLING_WEBHOOKS_STRIPE}`.replace(/^\/+/, "/"))
      .set("stripe-signature", "sig")
      .set("content-type", "application/json")
      .send('{"id":"evt_1"}');

  beforeAll(async () => {
    const module_ref = await Test.createTestingModule({
      controllers: [StripeWebhookController],
      providers: [{ provide: StripeWebhookService, useValue: webhook_service }],
    }).compile();

    // Same raw body + global filter/interceptor wiring as main.ts.
    app = module_ref.createNestApplication({ rawBody: true, logger: false });
    app.useGlobalInterceptors(new ResponseInterceptor());
    app.useGlobalFilters(new HttpErrorFilter());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("responde 2xx cuando el evento se procesa", async () => {
    webhook_service.handle.mockResolvedValue({ received: true });

    const response = await post();

    expect(response.status).toBeGreaterThanOrEqual(200);
    expect(response.status).toBeLessThan(300);
    expect(webhook_service.handle).toHaveBeenCalledWith(expect.any(Buffer), "sig");
  });

  it("responde 500 si el fulfillment falla, para que Stripe reintente", async () => {
    webhook_service.handle.mockRejectedValue(new Error("fulfillment failed"));

    const response = await post();

    expect(response.status).toBe(500);
  });

  it("responde 409 ante un duplicado concurrente en procesamiento", async () => {
    webhook_service.handle.mockRejectedValue(new ConflictException("busy"));

    const response = await post();

    expect(response.status).toBe(409);
  });

  it("responde 400 si la firma es inválida", async () => {
    webhook_service.handle.mockRejectedValue(new BadRequestException("firma"));

    const response = await post();

    expect(response.status).toBe(400);
  });
});
