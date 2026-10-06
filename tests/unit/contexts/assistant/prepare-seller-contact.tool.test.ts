import { describe, expect, it, vi } from "vitest";

vi.mock("@/src/contexts/vehicles/services/vehicle.service", () => ({ VehicleService: class {} }));
vi.mock("@/src/contexts/assistant/helpers/build-assistant-vehicle-summary", () => ({
  buildAssistantVehicleSummary: () => ({
    id: "veh-1",
    ref: null,
    title: "FORD Cougar 2000",
    price: 7000,
    mileage: 86_000,
    year: 2000,
  }),
}));

import { createPrepareSellerContactTool } from "@/src/contexts/assistant/tools/prepare-seller-contact.tool";

const SELLER_ID = "seller-1";

const buildVehicleService = (contact: Record<string, unknown>, status = "active") => ({
  findOne: vi.fn().mockResolvedValue({ status }),
  findSellerContactFields: vi.fn().mockResolvedValue({
    id: "veh-1",
    ref: null,
    has_whatsapp: true,
    show_phone: true,
    phone_code: "+34",
    phone: "639046016",
    email: "seller@example.com",
    profile_id: SELLER_ID,
    ...contact,
  }),
});

const channelTypes = async (
  vehicleService: ReturnType<typeof buildVehicleService>,
  userId = "buyer-1",
) => {
  const contactTool = createPrepareSellerContactTool({
    vehicleService: vehicleService as never,
    userId,
  }) as unknown as {
    execute: (input: unknown, options: unknown) => Promise<{ channels: { type: string }[] }>;
  };
  const result = await contactTool.execute({ vehicle_id: "veh-1" }, {});
  return result.channels.map((channel) => channel.type);
};

describe("prepareSellerContact", () => {
  it("da teléfono y WhatsApp si el vendedor los muestra", async () => {
    await expect(channelTypes(buildVehicleService({}))).resolves.toEqual([
      "wiauto_chat",
      "whatsapp",
      "phone",
      "email",
    ]);
  });

  it("no revela el número (ni por WhatsApp) si el vendedor lo oculta", async () => {
    await expect(channelTypes(buildVehicleService({ show_phone: false }))).resolves.toEqual([
      "wiauto_chat",
      "email",
    ]);
  });

  it("no revela el número de un anuncio inactivo", async () => {
    await expect(channelTypes(buildVehicleService({}, "paused"))).resolves.toEqual([
      "wiauto_chat",
      "email",
    ]);
  });

  it("no ofrece canales para contactar tu propio anuncio", async () => {
    await expect(channelTypes(buildVehicleService({}), SELLER_ID)).resolves.toEqual([]);
  });
});
