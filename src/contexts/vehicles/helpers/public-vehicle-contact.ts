export interface PublicVehicleContactInput {
  show_phone: boolean;
  has_whatsapp: boolean;
  phone_code: string;
  phone: string;
}

export interface PublicVehicleContact {
  show_phone: boolean;
  has_whatsapp: boolean;
  phone_code: string;
  phone: string;
}

export const toPublicVehicleContact = (
  input: PublicVehicleContactInput,
): PublicVehicleContact => ({
  show_phone: input.show_phone,
  has_whatsapp: input.has_whatsapp,
  phone_code: "",
  phone: "",
});
