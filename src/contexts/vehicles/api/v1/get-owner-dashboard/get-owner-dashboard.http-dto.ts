import { IsDateString, IsOptional, Matches } from "class-validator";

export class GetOwnerDashboardHttpDto {
  @IsOptional()
  @IsDateString({ strict: true })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: "start_date debe tener formato YYYY-MM-DD",
  })
  start_date?: string;

  @IsOptional()
  @IsDateString({ strict: true })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: "end_date debe tener formato YYYY-MM-DD",
  })
  end_date?: string;
}
