import { Controller, Get, Header, Query, UseGuards } from "@nestjs/common";

import { GetFatalLogsHttpDto } from "../dto/get-fatal-logs.http-dto";
import { OpsTokenGuard } from "../guards/ops-token.guard";
import { FatalLogsService } from "../services/fatal-logs.service";
import { V1_ADMIN_FATAL_LOGS } from "./route.constants";

/**
 * Errores fatales de API y worker (crashes, rechazos sin manejar, fallos de
 * arranque). Protegido con `X-Ops-Token` (OPS_TOKEN): los stacks exponen
 * rutas y detalles internos.
 */
@Controller()
@UseGuards(OpsTokenGuard)
export class FatalLogsController {
  constructor(private readonly fatalLogsService: FatalLogsService) {}

  @Get(V1_ADMIN_FATAL_LOGS)
  @Header("Cache-Control", "no-store")
  run(@Query() query: GetFatalLogsHttpDto) {
    return this.fatalLogsService.findRecent(query.role, query.limit);
  }
}
