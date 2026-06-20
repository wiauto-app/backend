import { IsUUID } from "class-validator";

export class UpdateDealershipMemberRoleParamsHttpDto {
  @IsUUID("4")
  id: string;

  @IsUUID("4")
  member_id: string;
}
