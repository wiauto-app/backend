import { describe, expect, it } from "vitest";

import { resolveVehicleContactVisibility } from "@/src/contexts/vehicles/helpers/public-vehicle-contact";

describe("resolveVehicleContactVisibility", () => {
  it("oculta teléfono y WhatsApp sin número registrado", () => {
    expect(
      resolveVehicleContactVisibility({
        show_phone: true,
        has_whatsapp: true,
        phone_code: "",
        phone: "",
      }),
    ).toEqual({ show_phone: false, show_whatsapp: false });
  });

  it("muestra teléfono con número y show_phone activo", () => {
    expect(
      resolveVehicleContactVisibility({
        show_phone: true,
        has_whatsapp: false,
        phone_code: "+34",
        phone: "600000000",
      }),
    ).toEqual({ show_phone: true, show_whatsapp: false });
  });

  it("muestra WhatsApp solo si hay teléfono y has_whatsapp", () => {
    expect(
      resolveVehicleContactVisibility({
        show_phone: true,
        has_whatsapp: true,
        phone_code: "+34",
        phone: "600000000",
      }),
    ).toEqual({ show_phone: true, show_whatsapp: true });
  });

  it("oculta teléfono si show_phone es false aunque haya número", () => {
    expect(
      resolveVehicleContactVisibility({
        show_phone: false,
        has_whatsapp: true,
        phone_code: "+34",
        phone: "600000000",
      }),
    ).toEqual({ show_phone: false, show_whatsapp: false });
  });
});
