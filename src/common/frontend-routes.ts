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
}

export const getFrontendUrl = (route: keyof typeof FRONTEND_ROUTES) => {
  return `${envs.FRONTEND_URL.trim()}${FRONTEND_ROUTES[route].trim()}`;
}