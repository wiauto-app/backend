import {
  IsInt,
  IsNotEmpty,
  IsString,
  IsUUID,
  Max,
  Min,
  MinLength,
} from "class-validator";

export class CreateReviewHttpDto {
  @IsUUID("4")
  vehicle_id: string;

  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  comment: string;
}
