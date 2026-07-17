import { IsUUID } from "class-validator";

export class RevokeDealershipInvitationHttpDto {
  @IsUUID("4")
  id: string;
}
