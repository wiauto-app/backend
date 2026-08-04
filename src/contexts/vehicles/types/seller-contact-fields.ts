/** Contacto del vendedor sin redacción pública (uso interno / asistente). */
export interface SellerContactFields {
  id: string;
  ref: number;
  has_whatsapp: boolean;
  show_phone: boolean;
  phone_code: string;
  phone: string;
  email: string;
  profile_id: string;
}
