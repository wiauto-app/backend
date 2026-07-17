import { Controller, Get, Query } from "@nestjs/common";

import { ReportCategoriesService } from "@/src/contexts/reports/services/report-categories.service";

import { V1_REPORT_CATEGORIES } from "../../route.constants";
import { FindAllReportCategoriesHttpDto } from "./find-all-report-categories.http-dto";

@Controller(V1_REPORT_CATEGORIES)
export class FindAllReportCategoriesController {
  constructor(
    private readonly report_categories_service: ReportCategoriesService,
  ) {}

  @Get()
  run(@Query() query: FindAllReportCategoriesHttpDto) {
    return this.report_categories_service.findAll(query);
  }
}
