import { IsDateString, IsIn, IsOptional, Matches } from "class-validator";

export class GetOwnerStatisticsHttpDto {
  @IsDateString({ strict: true })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: "since debe tener formato YYYY-MM-DD",
  })
  since: string;

  @IsOptional()
  @IsDateString({ strict: true })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: "until debe tener formato YYYY-MM-DD",
  })
  until?: string;

  @IsOptional()
  @IsIn(["day", "week", "month"])
  granularity?: "day" | "week" | "month";
}
