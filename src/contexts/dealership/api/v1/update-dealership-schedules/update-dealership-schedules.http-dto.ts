import { Type } from "class-transformer";
import {
  ArrayUnique,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsString,
  Matches,
  Max,
  Min,
  ValidateNested,
} from "class-validator";

const TIME_MESSAGE = "Debe tener formato HH:mm";
const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/;

export class DealershipOpenTimeHttpDto {
  @IsString()
  @IsNotEmpty()
  @Matches(TIME_REGEX, { message: TIME_MESSAGE })
  open_time: string;

  @IsString()
  @IsNotEmpty()
  @Matches(TIME_REGEX, { message: TIME_MESSAGE })
  close_time: string;
}

export class DealershipScheduleDayHttpDto {
  @IsInt()
  @Min(1)
  @Max(7)
  @Type(() => Number)
  day: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DealershipOpenTimeHttpDto)
  open_times: DealershipOpenTimeHttpDto[];
}

export class UpdateDealershipSchedulesHttpDto {
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayUnique((item: DealershipScheduleDayHttpDto) => item.day, {
    message: "No puede haber días duplicados en el horario",
  })
  @Type(() => DealershipScheduleDayHttpDto)
  schedules: DealershipScheduleDayHttpDto[];
}
