import { IsArray, IsIn } from "class-validator";

import { PROACTIVE_ALERT_TYPES } from "../../constants/proactive-alert-types";

const allowed = PROACTIVE_ALERT_TYPES.map((item) => item.type);

export class PatchProactiveAlertSettingsHttpDto {
  @IsArray()
  @IsIn(allowed, { each: true })
  enabled_types: string[];
}
