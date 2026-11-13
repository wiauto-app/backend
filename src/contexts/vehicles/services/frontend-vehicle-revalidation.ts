import { Logger } from "@nestjs/common";

import { envs } from "@/src/common/envs";

const logger = new Logger("FrontendVehicleRevalidation");
const TIMEOUT_MS = 3000;

const resolveRevalidateUrl = (): string =>
  envs.FRONTEND_REVALIDATE_URL ||
  `${envs.FRONTEND_URL.replace(/\/$/, "")}/api/revalidate/vehicle`;

/**
 * Pide a Next que invalide su caché de datos del detalle del anuncio
 * (`fetch` con tag `vehicle:{id}`, revalidate 1 h). Best-effort: nunca lanza
 * ni bloquea la escritura que lo disparó. Desactivado si no hay secreto.
 */
export const requestFrontendVehicleRevalidation = async (
  vehicle_id: string,
): Promise<void> => {
  if (!envs.FRONTEND_REVALIDATE_SECRET) {
    return;
  }

  try {
    const response = await fetch(resolveRevalidateUrl(), {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-revalidate-secret": envs.FRONTEND_REVALIDATE_SECRET,
      },
      body: JSON.stringify({ vehicle_id }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!response.ok) {
      logger.warn(
        `Next respondió ${response.status} al revalidar el vehículo ${vehicle_id}`,
      );
    }
  } catch (error) {
    logger.warn(
      `No se pudo revalidar la caché de Next del vehículo ${vehicle_id}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
};
