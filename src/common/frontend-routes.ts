import { envs } from "./envs";

export const FRONTEND_ROUTES = {
  HOME: "/",
  TEAM: "/equipo",
  SIGNIN: "/iniciar-sesion",
  REGISTER: "/registro",
  INVITATION_REJECTED: "/invitacion/rechazada",
  VERIFY_EMAIL: "/verificar-correo",
  RESET_PASSWORD: "/restablecer-contrasena",
  TWO_FACTOR_AUTH: "/2fa",
  TWO_FACTOR_AUTH_ENABLE: "/2fa/activar",
  TWO_FACTOR_AUTH_DISABLE: "/2fa/desactivar",
  TWO_FACTOR_AUTH_VERIFY: "/2fa/verificar",
  TWO_FACTOR_AUTH_RESEND: "/2fa/reenviar",
  VEHICLES: "/vehiculos",
  VEHICLE_DETAIL: "/vehiculo",
  EDIT_VEHICLE: "/editar-vehiculo",
  EDIT_VEHICLE_PROFESSIONAL: "/editar-vehiculo-profesional",
  CREATE_VEHICLE: "/crear-vehiculo",
  SELL_VEHICLE: "/vender-vehiculo",
  MY_LISTINGS: "/mis-anuncios",
  MESSAGES: "/mensajes",
  CONTACTS: "/contactos",
  PLANS: "/planes",
  ABOUT: "/sobre-nosotros",
  NEWS: "/noticias",
  CONTACT: "/contacto",
} as const;

const trim_base = (): string => envs.FRONTEND_URL.trim().replace(/\/$/, "");

export const getFrontendUrl = (route: keyof typeof FRONTEND_ROUTES): string => {
  return `${trim_base()}${FRONTEND_ROUTES[route]}`;
};

export const getFrontendPath = (path: string): string => {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${trim_base()}${normalized}`;
};

export const getVehicleDetailUrl = (vehicle_id: string): string =>
  getFrontendPath(`${FRONTEND_ROUTES.VEHICLE_DETAIL}/${vehicle_id}`);

export const getVehicleEditUrl = (
  vehicle_id: string,
  publisher_type: string,
): string => {
  const base =
    publisher_type === "professional"
      ? FRONTEND_ROUTES.EDIT_VEHICLE_PROFESSIONAL
      : FRONTEND_ROUTES.EDIT_VEHICLE;
  return getFrontendPath(`${base}/${vehicle_id}`);
};

export const getMyListingsUrl = (): string =>
  getFrontendUrl("MY_LISTINGS");

export const getMessagesUrl = (chat_id?: string): string => {
  const base = getFrontendUrl("MESSAGES");
  if (!chat_id) {
    return base;
  }
  return `${base}?chat_id=${encodeURIComponent(chat_id)}`;
};

export const getContactsUrl = (): string => getFrontendUrl("CONTACTS");

export const getMailBrandLogoUrl = (): string => {
  const override = envs.MAIL_BRAND_LOGO_URL?.trim();
  if (override) {
    return override;
  }
  return getFrontendPath("/branding/icon-logo.png");
};

export const getMailSocialIconUrl = (
  network: "facebook" | "instagram" | "x",
): string => getFrontendPath(`/icons/social-networks/${network}.svg`);
