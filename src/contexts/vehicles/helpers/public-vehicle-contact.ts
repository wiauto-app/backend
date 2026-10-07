export interface VehicleContactVisibilityInput {
  show_phone: boolean;
  has_whatsapp: boolean;
  phone_code?: string | null;
  phone?: string | null;
}

export interface VehicleContactVisibility {
  show_phone: boolean;
  show_whatsapp: boolean;
}

const hasRegisteredPhone = (
  phone_code?: string | null,
  phone?: string | null,
): boolean => {
  const normalizedPhone = phone?.trim() ?? "";
  const normalizedCode = phone_code?.trim() ?? "";
  return Boolean(normalizedPhone && normalizedCode);
};

/** Flags de UI para contacto (teléfono / WhatsApp) en detalle público del anuncio. */
export const resolveVehicleContactVisibility = (
  input: VehicleContactVisibilityInput,
): VehicleContactVisibility => {
  const phoneVisible =
    hasRegisteredPhone(input.phone_code, input.phone) && input.show_phone !== false;

  return {
    show_phone: phoneVisible,
    show_whatsapp: phoneVisible && input.has_whatsapp === true,
  };
};
