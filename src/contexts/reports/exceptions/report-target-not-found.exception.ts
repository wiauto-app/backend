import { ValidationException } from "@/src/contexts/shared/exceptions/validation.exception";

import { ReportTargetType } from "../types/report-category";

export class ReportTargetNotFoundException extends ValidationException {
  constructor(
    public readonly target_type: ReportTargetType,
    public readonly target_id: string,
  ) {
    super(
      `Objetivo de denuncia de tipo ${target_type} con id ${target_id} no encontrado`,
    );
  }
}
