import { ConflictException } from "@nestjs/common";
import { QueryFailedError } from "typeorm";

/** Unique de `vehicles.ref` (TypeORM / Postgres). */
const VEHICLE_REF_UNIQUE_CONSTRAINT = "UQ_90bd206d5b617610bc1adda81b0";

export class VehicleRefAlreadyExistsException extends ConflictException {
  constructor() {
    super("Ya existe un vehículo con esa referencia");
  }
}

export const isVehicleRefUniqueViolation = (error: unknown): boolean => {
  if (!(error instanceof QueryFailedError)) {
    return false;
  }

  const driver = (
    error as QueryFailedError & {
      driverError?: { code?: string; constraint?: string; detail?: string };
    }
  ).driverError;

  if (driver?.code !== "23505") {
    return false;
  }

  const constraint = driver.constraint ?? "";
  const detail = driver.detail ?? "";

  return (
    constraint === VEHICLE_REF_UNIQUE_CONSTRAINT ||
    constraint.toLowerCase().includes("ref") ||
    /\(ref\)\s*=/i.test(detail)
  );
};
