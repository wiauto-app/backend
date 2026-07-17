import { Type } from "class-transformer";
import { IsDate } from "class-validator";

export class ScheduleVehicleHttpDto {
  @Type(() => Date)
  @IsDate()
  scheduled_publish_at: Date;
}
