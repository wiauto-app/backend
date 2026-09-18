import {
  Controller,
  HttpException,
  HttpStatus,
  Logger,
  Post,
  Query,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from "@nestjs/common";
import { Request, Response } from "express";

import { JwtGuard } from "@/src/contexts/auth/guards/auth.guard";
import { formatIsoDay } from "@/src/contexts/shared/pdf-export/dashboard-pdf.formatters";
import { PdfExportService } from "@/src/contexts/shared/pdf-export/pdf-export.service";
import { PdfRenderError, PdfTimeoutError } from "@/src/contexts/shared/pdf-export/types";
import { OwnerDashboardService } from "@/src/contexts/vehicles/services/owner-dashboard.service";

import { V1_OWNER, V1_OWNER_DASHBOARD_EXPORT } from "../../route.constants";
import { ExportDashboardHttpDto } from "./export-dashboard.http-dto";

@Controller(V1_OWNER)
@UseGuards(JwtGuard)
export class ExportDashboardController {
  private readonly logger = new Logger(ExportDashboardController.name);

  constructor(
    private readonly owner_dashboard_service: OwnerDashboardService,
    private readonly pdf_export_service: PdfExportService,
  ) {}

  @Post(V1_OWNER_DASHBOARD_EXPORT)
  async run(
    @Query() query: ExportDashboardHttpDto,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    const user = req.user;
    if (!user) {
      throw new UnauthorizedException("Usuario no autenticado");
    }

    const started_at = Date.now();

    try {
      const dashboard = await this.owner_dashboard_service.getDashboard({
        profile_id: user.id,
        start_date: query.start_date,
        end_date: query.end_date,
      });

      const pdf = await this.pdf_export_service.generateDashboardPdf(dashboard);
      const range = `${formatIsoDay(dashboard.period.start)}_${formatIsoDay(dashboard.period.end)}`;

      this.logger.log(
        `Dashboard exportado user=${user.id} range=${range} bytes=${pdf.length} ms=${Date.now() - started_at} ip=${req.ip}`,
      );

      res.set({
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="wiauto-resumen_${range}.pdf"`,
        "Content-Length": pdf.length,
      });

      res.send(pdf);
    } catch (error) {
      if (error instanceof PdfTimeoutError) {
        this.logger.warn(`Export timeout user=${user.id} ms=${Date.now() - started_at}`);
        throw new HttpException("PDF generation timeout", HttpStatus.GATEWAY_TIMEOUT);
      }

      if (error instanceof PdfRenderError) {
        throw new HttpException("PDF rendering failed", HttpStatus.INTERNAL_SERVER_ERROR);
      }

      throw error;
    }
  }
}
