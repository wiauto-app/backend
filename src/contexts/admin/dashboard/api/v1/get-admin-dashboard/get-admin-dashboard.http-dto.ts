import { IsDateString, IsOptional, Matches } from "class-validator";

export class GetAdminDashboardHttpDto {
  @IsOptional()
  @IsDateString({ strict: true })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: "startDate debe tener formato YYYY-MM-DD",
  })
  startDate?: string;

  @IsOptional()
  @IsDateString({ strict: true })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: "endDate debe tener formato YYYY-MM-DD",
  })
  endDate?: string;
}
