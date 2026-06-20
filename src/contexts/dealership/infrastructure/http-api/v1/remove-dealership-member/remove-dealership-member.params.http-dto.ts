import { IsUUID } from "class-validator";

export class RemoveDealershipMemberParamsHttpDto {
  @IsUUID("4")
  id: string;

  @IsUUID("4")
  member_id: string;
}
