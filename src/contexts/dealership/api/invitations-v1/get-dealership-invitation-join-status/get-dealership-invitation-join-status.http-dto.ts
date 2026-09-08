import { IsUUID } from "class-validator";

export class GetDealershipInvitationJoinStatusHttpDto {
  @IsUUID("4")
  id: string;
}
