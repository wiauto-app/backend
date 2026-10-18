import { createHash } from "crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { envs } from "@/src/common/envs";
import {
  buildMetaUserData,
  hashMetaEmail,
  hashMetaPhone,
  hashMetaText,
  MetaCapiService,
  readMetaClientIp,
  sha256Hex,
} from "@/src/contexts/analytics/services/meta-capi.service";
import { VehiclePublishMetaCapiService } from "@/src/contexts/analytics/services/vehicle-publish-meta-capi.service";

vi.mock("@/src/common/envs", () => ({
  envs: {
    META_PIXEL_ID: "",
    META_CAPI_TOKEN: "",
    META_API_VERSION: "v21.0",
    META_TEST_EVENT_CODE: "",
  },
}));

const sha = (value: string) => createHash("sha256").update(value).digest("hex");

describe("hash Meta CAPI", () => {
  it("normaliza el email antes de hashear", () => {
    expect(hashMetaEmail("  Ada@Mail.COM ")).toBe(sha("ada@mail.com"));
    expect(hashMetaEmail("   ")).toBeUndefined();
  });

  it("deja el teléfono en dígitos y antepone 34 si tiene 9", () => {
    expect(hashMetaPhone("612 345 678")).toBe(sha("34612345678"));
    expect(hashMetaPhone("+34 612 345 678")).toBe(sha("34612345678"));
    expect(hashMetaPhone("abc")).toBeUndefined();
  });

  it("quita diacríticos del texto y hashea el país y el id", () => {
    expect(hashMetaText("Málaga")).toBe(sha("malaga"));
    expect(hashMetaText("José")).toBe(sha("jose"));
    expect(sha256Hex("es")).toBe(sha("es"));
    expect(sha256Hex("user-1")).toBe(sha("user-1"));
  });

  it("omite claves sin valor y no deja el email en claro", () => {
    const userData = buildMetaUserData({
      eventName: "AnuncioPublicado",
      eventId: "evt-1",
      pageUrl: "https://wiauto.es/publicar",
      user: {
        id: "user-1",
        firstName: "Málaga",
      },
      fbp: "fb.1.1",
    });

    expect(userData).not.toHaveProperty("em");
    expect(userData).not.toHaveProperty("ph");
    expect(userData.fn).toEqual([sha("malaga")]);
    expect(userData.country).toEqual([sha("es")]);
    expect(userData.external_id).toEqual([sha("user-1")]);
    expect(JSON.stringify(userData)).not.toContain("Málaga");
    expect(JSON.stringify(userData)).not.toContain("user-1");
  });

  it("prioriza cf-connecting-ip y si no el primer x-forwarded-for", () => {
    expect(
      readMetaClientIp({
        headers: {
          "cf-connecting-ip": "1.1.1.1",
          "x-forwarded-for": "9.9.9.9, 8.8.8.8",
        },
      } as never),
    ).toBe("1.1.1.1");

    expect(
      readMetaClientIp({
        headers: { "x-forwarded-for": "9.9.9.9, 8.8.8.8" },
      } as never),
    ).toBe("9.9.9.9");
  });
});

describe("MetaCapiService", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockReset();
    envs.META_PIXEL_ID = "";
    envs.META_CAPI_TOKEN = "";
    envs.META_API_VERSION = "v21.0";
    envs.META_TEST_EVENT_CODE = "";
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("no llama a fetch si faltan credenciales", async () => {
    const service = new MetaCapiService();
    await service.sendMetaEvent({
      eventName: "AnuncioPublicado",
      eventId: "evt-1",
      pageUrl: "https://wiauto.es/publicar",
      user: { email: "ada@mail.com", phone: "612345678" },
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("no llama a fetch sin eventId", async () => {
    envs.META_PIXEL_ID = "1387947556017311";
    envs.META_CAPI_TOKEN = "token-de-prueba";
    const service = new MetaCapiService();
    await service.sendMetaEvent({
      eventName: "CompleteRegistration",
      eventId: "   ",
      pageUrl: "https://wiauto.es/registro",
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("envía el evento sin el token ni el email en el cuerpo", async () => {
    envs.META_PIXEL_ID = "1387947556017311";
    envs.META_CAPI_TOKEN = "token-de-prueba";
    fetchMock.mockResolvedValue({ ok: true, status: 200 });
    const service = new MetaCapiService();

    await service.sendMetaEvent({
      eventName: "CompleteRegistration",
      eventId: "evt-reg",
      pageUrl: "https://wiauto.es/registro",
      user: { id: "user-1", email: "Ada@Mail.com" },
      customData: { method: "email", brand: undefined },
    });

    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("graph.facebook.com/v21.0/1387947556017311/events");
    expect(url).toContain("access_token=");
    const payload = JSON.parse(String(init.body)) as {
      data: Array<{ custom_data: Record<string, unknown>; user_data: Record<string, unknown> }>;
    };
    expect(payload.data[0].custom_data).toEqual({ method: "email" });
    expect(payload.data[0].custom_data).not.toHaveProperty("brand");
    expect(JSON.stringify(payload)).not.toContain("Ada@Mail.com");
    expect(JSON.stringify(payload)).not.toContain("token-de-prueba");
  });
});

describe("VehiclePublishMetaCapiService", () => {
  it("no llama a sendMetaEvent si no hay consentimiento", () => {
    const sendMetaEvent = vi.fn();
    const service = new VehiclePublishMetaCapiService(
      { sendMetaEvent } as never,
      { findOne: vi.fn() } as never,
      { findOne: vi.fn() } as never,
    );

    service.sendAfterVehicleCreated({
      tracking: {
        consent: false,
        eventId: "evt-1",
        pageUrl: "https://wiauto.es/publicar",
        vehicleDataEventId: "evt-datos",
      },
      user: { id: "user-1", email: "ada@mail.com" } as never,
      req: { headers: {} } as never,
      listing: {
        id: "listing-1",
        price: 12000,
        versionId: 1,
      },
    });

    expect(sendMetaEvent).not.toHaveBeenCalled();
  });
});
